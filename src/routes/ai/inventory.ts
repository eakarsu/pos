import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * POST /api/v1/ai/inventory
 * Analyzes stock levels vs sales velocity to produce prioritized reorder recommendations.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Current inventory levels with product details
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { product: { isNot: null } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            cost: true,
            reorderPoint: true,
            minStock: true,
            maxStock: true,
            supplierId: true,
          },
        },
      },
    });

    // Sales velocity: units sold per product over last 30 days
    const salesVelocity30 = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        productId: { not: null },
        sale: { createdAt: { gte: since30 }, status: { not: 'CANCELLED' } },
      },
    });

    // Sales velocity: last 7 days (for trend)
    const salesVelocity7 = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        productId: { not: null },
        sale: { createdAt: { gte: since7 }, status: { not: 'CANCELLED' } },
      },
    });

    const vel30Map = new Map(salesVelocity30.map((v) => [v.productId!, v._sum.quantity ?? 0]));
    const vel7Map = new Map(salesVelocity7.map((v) => [v.productId!, v._sum.quantity ?? 0]));

    // Build enriched inventory analysis per product
    const analysis = inventoryItems
      .filter((item) => item.product)
      .map((item) => {
        const product = item.product!;
        const sold30 = vel30Map.get(product.id) ?? 0;
        const sold7 = vel7Map.get(product.id) ?? 0;
        const dailyVelocity30 = sold30 / 30;
        const dailyVelocity7 = sold7 / 7;
        const daysOfStockLeft = dailyVelocity7 > 0 ? item.quantity / dailyVelocity7 : null;
        const projectedStockout = daysOfStockLeft !== null ? daysOfStockLeft <= 7 : false;

        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: item.quantity,
          reorderPoint: product.reorderPoint,
          minStock: product.minStock,
          maxStock: product.maxStock,
          unitCost: product.cost,
          unitPrice: product.price,
          sold30Days: sold30,
          sold7Days: sold7,
          dailyVelocity30Days: Math.round(dailyVelocity30 * 100) / 100,
          dailyVelocity7Days: Math.round(dailyVelocity7 * 100) / 100,
          daysOfStockRemaining: daysOfStockLeft !== null ? Math.round(daysOfStockLeft * 10) / 10 : 'No recent sales',
          projectedStockoutIn7Days: projectedStockout,
          belowReorderPoint: item.quantity <= (product.reorderPoint ?? 0),
        };
      });

    // Sort: stockout risk first, then below reorder, then by days remaining
    analysis.sort((a, b) => {
      if (a.projectedStockoutIn7Days && !b.projectedStockoutIn7Days) return -1;
      if (!a.projectedStockoutIn7Days && b.projectedStockoutIn7Days) return 1;
      if (a.belowReorderPoint && !b.belowReorderPoint) return -1;
      if (!a.belowReorderPoint && b.belowReorderPoint) return 1;
      const adays = typeof a.daysOfStockRemaining === 'number' ? a.daysOfStockRemaining : 999;
      const bdays = typeof b.daysOfStockRemaining === 'number' ? b.daysOfStockRemaining : 999;
      return adays - bdays;
    });

    const systemPrompt = `You are an inventory management expert for a retail Point-of-Sale system.
Analyze the provided inventory and sales velocity data. Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence executive summary of inventory health",
  "criticalItems": [
    {
      "name": "...",
      "sku": "...",
      "urgency": "critical|high|medium",
      "currentStock": 0,
      "recommendedReorderQty": 0,
      "reasoning": "...",
      "estimatedCost": 0,
      "daysUntilStockout": 0
    }
  ],
  "reorderList": [
    {
      "name": "...",
      "sku": "...",
      "currentStock": 0,
      "suggestedOrderQty": 0,
      "suggestedOrderValue": 0,
      "priority": "immediate|this_week|this_month",
      "rationale": "..."
    }
  ],
  "overstockedItems": [
    {
      "name": "...",
      "sku": "...",
      "currentStock": 0,
      "suggestion": "..."
    }
  ],
  "totalReorderInvestment": 0,
  "recommendations": ["..."]
}
Base reorder quantities on 30-day velocity * 1.5 safety stock factor, rounded up to nearest logical order unit.`;

    const aiResponseRaw = await callAI(systemPrompt, JSON.stringify({ inventory: analysis }, null, 2));
    const aiResponse = parseAIJson(aiResponseRaw);

    // Persist insight
    await prisma.aiInsight.create({
      data: {
        type: 'inventory',
        payload: JSON.stringify({ input: { itemCount: analysis.length }, output: aiResponse }),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        inventorySummary: {
          totalProducts: analysis.length,
          stockoutRisk: analysis.filter((i) => i.projectedStockoutIn7Days).length,
          belowReorderPoint: analysis.filter((i) => i.belowReorderPoint).length,
        },
        analysis,
        recommendations: aiResponse,
      },
    });
  } catch (error: any) {
    console.error('AI inventory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate inventory recommendations',
    });
  }
});

// GET /api/v1/ai/inventory - Return most recent inventory insights
router.get('/', async (req: Request, res: Response) => {
  try {
    const insights = await prisma.aiInsight.findMany({
      where: { type: 'inventory' },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      success: true,
      data: insights.map((i) => ({
        id: i.id,
        type: i.type,
        generatedAt: i.generatedAt,
        recommendations: JSON.parse(i.payload).output,
      })),
    });
  } catch (error: any) {
    console.error('AI inventory fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory insights' });
  }
});

export default router;

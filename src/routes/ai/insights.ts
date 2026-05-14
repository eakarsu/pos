import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * POST /api/v1/ai/insights
 * Fetches last 30 days of sales data and returns AI-generated business insights.
 * Persists results to ai_insights table.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Gather sales data
    const [salesAgg, salesByDay, salesByHour, topProducts, paymentMethods] = await Promise.all([
      // Overall 30-day aggregates
      prisma.sale.aggregate({
        _sum: { totalAmount: true, taxAmount: true, discountAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      }),

      // Sales grouped by date (raw SQL-compatible approach via findMany + grouping in JS)
      prisma.sale.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),

      // All sales for hour extraction
      prisma.sale.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, totalAmount: true },
      }),

      // Top products by revenue in last 30 days
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, totalPrice: true },
        where: {
          productId: { not: null },
          sale: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),

      // Payment method breakdown
      prisma.payment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        _count: { id: true },
        where: { createdAt: { gte: since }, status: 'PAID' },
      }),
    ]);

    // Aggregate sales by day of week (0=Sun…6=Sat)
    const byDayOfWeek: Record<number, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) byDayOfWeek[i] = { count: 0, revenue: 0 };

    // Aggregate by calendar date for trend
    const byDate: Record<string, { count: number; revenue: number }> = {};

    for (const sale of salesByDay) {
      const dow = sale.createdAt.getDay();
      byDayOfWeek[dow].count += 1;
      byDayOfWeek[dow].revenue += sale.totalAmount;

      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = { count: 0, revenue: 0 };
      byDate[dateKey].count += 1;
      byDate[dateKey].revenue += sale.totalAmount;
    }

    // Aggregate by hour
    const byHour: Record<number, { count: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) byHour[h] = { count: 0, revenue: 0 };
    for (const sale of salesByHour) {
      const h = sale.createdAt.getHours();
      byHour[h].count += 1;
      byHour[h].revenue += sale.totalAmount;
    }

    // Fetch product names for top products
    const productIds = topProducts.map((p) => p.productId!).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const salesData = {
      period: '30 days',
      totalRevenue: salesAgg._sum.totalAmount ?? 0,
      totalTransactions: salesAgg._count.id,
      averageOrderValue: salesAgg._avg.totalAmount ?? 0,
      totalDiscounts: salesAgg._sum.discountAmount ?? 0,
      byDayOfWeek: Object.entries(byDayOfWeek).map(([dow, v]) => ({
        day: dayNames[Number(dow)],
        transactions: v.count,
        revenue: Math.round(v.revenue * 100) / 100,
      })),
      byHour: Object.entries(byHour)
        .filter(([, v]) => v.count > 0)
        .map(([h, v]) => ({
          hour: `${String(Number(h)).padStart(2, '0')}:00`,
          transactions: v.count,
          revenue: Math.round(v.revenue * 100) / 100,
        })),
      topProducts: topProducts.map((tp) => ({
        name: productMap.get(tp.productId!)?.name ?? 'Unknown',
        sku: productMap.get(tp.productId!)?.sku ?? '',
        quantitySold: tp._sum.quantity ?? 0,
        revenue: Math.round((tp._sum.totalPrice ?? 0) * 100) / 100,
      })),
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.method,
        transactions: pm._count.id,
        revenue: Math.round((pm._sum.amount ?? 0) * 100) / 100,
      })),
      dailyTrend: Object.entries(byDate).map(([date, v]) => ({
        date,
        transactions: v.count,
        revenue: Math.round(v.revenue * 100) / 100,
      })),
    };

    const systemPrompt = `You are a retail analytics expert for a Point-of-Sale system.
Analyze the provided 30-day sales data and return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of performance",
  "bestSellingTimes": [{"time": "...", "insight": "...", "recommendation": "..."}],
  "slowPeriods": [{"period": "...", "insight": "...", "recommendation": "..."}],
  "productRecommendations": [{"product": "...", "insight": "...", "action": "..."}],
  "staffingRecommendations": [{"period": "...", "suggestion": "...", "rationale": "..."}],
  "revenueOpportunities": [{"opportunity": "...", "estimatedImpact": "...", "howTo": "..."}],
  "alerts": [{"type": "warning|info|success", "message": "..."}]
}`;

    const aiResponseRaw = await callAI(systemPrompt, JSON.stringify(salesData, null, 2));
    const aiResponse = parseAIJson(aiResponseRaw);

    // Persist to ai_insights table
    const saved = await prisma.aiInsight.create({
      data: {
        type: 'sales',
        payload: JSON.stringify({ input: salesData, output: aiResponse }),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        insightId: saved.id,
        generatedAt: saved.generatedAt,
        salesSummary: salesData,
        insights: aiResponse,
      },
    });
  } catch (error: any) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI insights',
    });
  }
});

// GET /api/v1/ai/insights - Return the most recent persisted insight
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;
    const insights = await prisma.aiInsight.findMany({
      where: { type: 'sales' },
      orderBy: { generatedAt: 'desc' },
      take: Math.min(Number(limit), 20),
    });

    res.status(200).json({
      success: true,
      data: insights.map((i) => ({
        id: i.id,
        type: i.type,
        generatedAt: i.generatedAt,
        insights: JSON.parse(i.payload).output,
      })),
    });
  } catch (error: any) {
    console.error('AI insights fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch insights' });
  }
});

export default router;

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/ai/reorder
 * Predictive reorder agent. Computes 30-day sale velocity per product,
 * compares to current stock, and asks the LLM to draft a purchase-order
 * recommendation with reasoning.
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const started = Date.now();
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const velocityRows = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        productId: { not: null },
        sale: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      },
    });

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventory: true },
      take: 500,
    });

    const productInfo = products.map((p) => {
      const v = velocityRows.find((r) => r.productId === p.id);
      const sold30 = v?._sum.quantity ?? 0;
      const onHand = p.inventory.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
      const dailyVelocity = sold30 / 30;
      const daysOfCover = dailyVelocity > 0 ? onHand / dailyVelocity : 999;
      const reorderPoint = p.reorderPoint || 0;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        onHand,
        sold30,
        dailyVelocity: Math.round(dailyVelocity * 100) / 100,
        daysOfCover: Math.round(daysOfCover * 10) / 10,
        reorderPoint,
        cost: p.cost,
        belowReorder: onHand <= reorderPoint,
      };
    });

    const candidates = productInfo
      .filter((p) => p.belowReorder || p.daysOfCover < 14)
      .sort((a, b) => a.daysOfCover - b.daysOfCover)
      .slice(0, 30);

    const systemPrompt = `You are a retail purchasing analyst. Given product velocity + inventory data,
draft a purchase-order recommendation. Return ONLY JSON:
{
  "summary": "1-2 sentence overview",
  "lines": [
    {"productId": "...", "sku": "...", "name": "...", "suggestedQty": 0, "rationale": "...", "urgency": "high|medium|low"}
  ],
  "estimatedCost": 0,
  "notes": ["..."]
}`;

    const raw = await callAI(systemPrompt, JSON.stringify({ candidates }, null, 2), {
      temperature: 0.2,
      maxTokens: 2048,
    });
    const plan = parseAIJson(raw);

    const saved = await prisma.aiResult.create({
      data: {
        feature: 'reorder',
        userId: req.user?.id,
        input: { candidateCount: candidates.length },
        output: plan as any,
        model: 'anthropic/claude-3-5-sonnet-20241022',
        durationMs: Date.now() - started,
        status: 'success',
      },
    });

    res.json({ success: true, data: { id: saved.id, plan, candidates } });
  } catch (err: any) {
    await prisma.aiResult
      .create({
        data: {
          feature: 'reorder',
          userId: req.user?.id,
          input: {},
          output: {},
          status: 'error',
          errorMessage: err.message,
          durationMs: Date.now() - started,
        },
      })
      .catch(() => {});
    res.status(500).json({ success: false, message: err.message });
  }
});

// Paginated history of reorder recommendations.
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
    const [items, total] = await Promise.all([
      prisma.aiResult.findMany({
        where: { feature: 'reorder' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiResult.count({ where: { feature: 'reorder' } }),
    ]);
    res.json({
      success: true,
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

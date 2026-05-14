import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/ai/elasticity
 * Body: { productId: string }
 * Computes price/volume series from Sale history and asks the LLM to
 * estimate price elasticity + recommend an optimal price band.
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const started = Date.now();
  const { productId } = req.body || {};
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }
  try {
    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const items = await prisma.saleItem.findMany({
      where: {
        productId,
        sale: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      },
      include: { sale: { select: { createdAt: true } } },
    });

    // Bucket by price-bin and week
    const byBin: Record<string, { qty: number; revenue: number; transactions: number }> = {};
    for (const it of items) {
      const bin = (Math.round(it.unitPrice * 100) / 100).toFixed(2);
      if (!byBin[bin]) byBin[bin] = { qty: 0, revenue: 0, transactions: 0 };
      byBin[bin].qty += it.quantity;
      byBin[bin].revenue += it.totalPrice;
      byBin[bin].transactions += 1;
    }
    const series = Object.entries(byBin).map(([price, v]) => ({
      price: Number(price),
      ...v,
      avgQtyPerTxn: Math.round((v.qty / Math.max(1, v.transactions)) * 100) / 100,
    }));

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'product not found' });

    const systemPrompt = `You are a retail pricing scientist. Estimate price elasticity from observed
price/volume bins. Return ONLY JSON:
{
  "elasticityCoefficient": -1.0,
  "interpretation": "elastic|unit|inelastic",
  "currentPrice": 0,
  "recommendedPriceBand": {"low": 0, "high": 0, "expectedLift": "..."},
  "experimentSuggestion": {"variantA": 0, "variantB": 0, "duration": "...", "metric": "..."},
  "confidence": "low|medium|high",
  "rationale": "1-2 sentences"
}`;

    const raw = await callAI(
      systemPrompt,
      JSON.stringify({ product: { name: product.name, cost: product.cost, currentPrice: product.price }, series }, null, 2),
      { temperature: 0.2, maxTokens: 1024 }
    );
    const plan = parseAIJson(raw);

    const saved = await prisma.aiResult.create({
      data: {
        feature: 'elasticity',
        userId: req.user?.id,
        input: { productId, sampleSize: items.length, bins: series.length },
        output: plan as any,
        model: 'anthropic/claude-3-5-sonnet-20241022',
        durationMs: Date.now() - started,
        status: 'success',
      },
    });

    res.json({ success: true, data: { id: saved.id, plan, series } });
  } catch (err: any) {
    await prisma.aiResult
      .create({
        data: {
          feature: 'elasticity',
          userId: req.user?.id,
          input: { productId },
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

export default router;

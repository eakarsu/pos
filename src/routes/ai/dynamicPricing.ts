import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { callAI, parseAIJson } from '../../services/aiService';

/**
 * POST /api/v1/ai/dynamic-pricing
 *
 * Surge pricing on high-demand items + clearance on slow-movers.
 * Body: { productId: string, marketSignals?: { competitorPrice?: number, demandSignals?: any[] } }
 */
const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response) => {
  const productId: string | undefined = req.body?.productId;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId required' });
  }

  let product: any = null;
  let recentSales: any[] = [];
  let onHand = 0;
  try {
    product = await (prisma as any).product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, cost: true, categoryId: true },
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'product not found' });
    }
    recentSales = await (prisma as any).saleItem.findMany({
      where: { productId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { quantity: true, unitPrice: true, createdAt: true },
    });
    const inv = await (prisma as any).inventory.findFirst({
      where: { productId },
      select: { quantity: true },
    });
    onHand = inv?.quantity || 0;
  } catch {
    // schema mismatch — proceed without DB context
  }

  const sys =
    'You are a dynamic pricing strategist. Given product attributes, recent sale velocity, current stock, and competitor signals, recommend a pricing tier: surge|hold|clearance, suggested price, and rationale. Output JSON.';
  const user = `Product: ${JSON.stringify(product)}\nRecent sales (last 50): ${JSON.stringify(recentSales)}\nOnHand: ${onHand}\nMarketSignals: ${JSON.stringify(req.body?.marketSignals || {})}`;

  try {
    const raw = await callAI(sys, user, { temperature: 0.4, maxTokens: 900 });
    const parsed = parseAIJson(raw);
    res.json({ success: true, raw, parsed });
  } catch (e: any) {
    res.status(503).json({ success: false, message: e?.message || 'AI unavailable' });
  }
});

export default router;

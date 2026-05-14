import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { callAI, parseAIJson } from '../../services/aiService';

/**
 * Customer Loyalty Automation — track purchases; auto-apply discounts/rewards.
 * Endpoints:
 *   POST /api/v1/ai/loyalty/tier — compute tier + rewards for customer
 *   POST /api/v1/ai/loyalty/auto-discount — propose discount at checkout
 */
const router = Router();
const prisma = new PrismaClient();

const TIERS = [
  { name: 'Bronze', minSpend: 0, multiplier: 1.0 },
  { name: 'Silver', minSpend: 500, multiplier: 1.1 },
  { name: 'Gold', minSpend: 2000, multiplier: 1.25 },
  { name: 'Platinum', minSpend: 10000, multiplier: 1.5 },
];

router.post('/tier', async (req: Request, res: Response) => {
  const customerId: string | undefined = req.body?.customerId;
  if (!customerId) return res.status(400).json({ success: false, message: 'customerId required' });

  let totalSpend = 0;
  let visitCount = 0;
  try {
    const sales = await (prisma as any).sale.findMany({
      where: { customerId },
      select: { totalAmount: true },
    });
    totalSpend = sales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);
    visitCount = sales.length;
  } catch {
    // tolerate schema drift
  }

  const tier = [...TIERS].reverse().find((t) => totalSpend >= t.minSpend) || TIERS[0];
  res.json({ success: true, customerId, totalSpend, visitCount, tier });
});

router.post('/auto-discount', async (req: Request, res: Response) => {
  const { customerId, cartTotal, items = [] } = req.body || {};
  if (!customerId || cartTotal == null) {
    return res.status(400).json({ success: false, message: 'customerId and cartTotal required' });
  }
  const sys =
    'You are a loyalty engine. Suggest a one-time discount % (0-20) and a personalized message based on tier and cart contents. Output JSON: { discountPct, message, reasoning }.';
  const user = `Customer: ${customerId}\nCart total: $${cartTotal}\nItems: ${JSON.stringify(items).slice(0, 1500)}`;
  try {
    const raw = await callAI(sys, user, { temperature: 0.5, maxTokens: 500 });
    res.json({ success: true, raw, parsed: parseAIJson(raw) });
  } catch (e: any) {
    res.status(503).json({ success: false, message: e?.message || 'AI unavailable' });
  }
});

export default router;

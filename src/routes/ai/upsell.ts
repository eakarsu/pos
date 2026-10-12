import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { callAI, parseAIJson } from '../../services/aiService';
import { aiRequestScope } from '../../services/aiCancellation';
import { ownedInsights, saveInsight } from '../../services/aiInsightHistory';
import type { AuthRequest } from '../../middleware/auth';

/**
 * POST /api/v1/ai/upsell
 *
 * Checkout-time upsell recommendations.
 * Body: { items: [{ productId: string, qty?: number }], customerId?: string }
 *
 * Strategy:
 *   1. Resolve each cart product (name, category, price, recent co-occurrences).
 *   2. Compute candidate add-ons via co-purchase frequency from completed sales.
 *   3. Ask the LLM to pick the top 3 with cashier scripts ("Want to add X for $Y?").
 *
 * Implements audit batch_11.md §pos suggestion #1
 * ("AI-Driven Upsell Recommendations").
 */
const router = Router();
const prisma = new PrismaClient();

interface CartItem {
  productId: string;
  qty?: number;
}

router.post('/', async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ success: false, message: 'Authentication required' });
  const items: CartItem[] = Array.isArray(req.body?.items) ? req.body.items : [];
  const customerId: string | undefined = req.body?.customerId;

  if (items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'items[] is required and must be non-empty' });
  }

  const scope = aiRequestScope(req, res);
  try {
    scope.signal.throwIfAborted();
    if (customerId !== undefined && typeof customerId !== 'string') return res.status(400).json({ success: false, message: 'Choose a saved customer or leave the customer field empty.' });
    if (items.length > 40 || items.some(item => typeof item?.productId !== 'string' || !item.productId || (item.qty !== undefined && (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 1000)))) return res.status(400).json({ success: false, message: 'Choose 1-40 saved products with positive whole-number quantities up to 1,000.' });
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    if (cartProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No active products matched the cart' });
    }

    if (new Set(items.map(item => item.productId)).size !== cartProducts.length) return res.status(404).json({ success: false, message: 'One or more selected products are unavailable.' });

    // Co-purchase signal: sales in the last 90 days that contained any cart product
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const coPurchaseSales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
        items: { some: { productId: { in: cartProducts.map((p) => p.id) } } },
      },
      select: {
        id: true,
        items: {
          select: {
            productId: true,
            product: { select: { id: true, name: true, price: true, isActive: true } },
          },
        },
      },
      take: 500,
    });

    // Tally co-purchase counts (excluding the cart items themselves)
    const cartIds = new Set(cartProducts.map((p) => p.id));
    const coCount = new Map<string, { name: string; price: number; count: number }>();
    for (const sale of coPurchaseSales) {
      const seen = new Set<string>();
      for (const item of sale.items) {
        if (!item.productId || cartIds.has(item.productId) || !item.product?.isActive) continue;
        if (seen.has(item.productId)) continue;
        seen.add(item.productId);
        const prev = coCount.get(item.productId);
        if (prev) {
          prev.count++;
        } else {
          coCount.set(item.productId, {
            name: item.product.name,
            price: item.product.price,
            count: 1,
          });
        }
      }
    }

    const topCandidates = Array.from(coCount.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    let customerSummary: { totalSpent: number; loyaltyPoints: number; lastPurchase?: Date } | null =
      null;
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          totalSpent: true,
          loyaltyPoints: true,
          sales: {
            where: { status: { not: 'CANCELLED' } },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (!customer) return res.status(404).json({ success: false, message: 'The selected customer no longer exists.' });
      if (customer) {
        customerSummary = {
          totalSpent: customer.totalSpent,
          loyaltyPoints: customer.loyaltyPoints,
          lastPurchase: customer.sales[0]?.createdAt,
        };
      }
    }

    const systemPrompt = `You are an upsell strategist for a retail Point-of-Sale system.
You suggest at most 3 add-on products that the cashier should offer at checkout.
Pick from the candidate list. Prefer items with high co-purchase frequency, complementary
to the cart, and within a reasonable price band relative to the current order.
Return ONLY JSON with this schema:
{
  "recommendations": [
    {
      "productId": "...",
      "name": "...",
      "price": 0,
      "rationale": "1-sentence reason",
      "cashierScript": "Friendly suggestion the cashier can read aloud (<=140 chars)"
    }
  ],
  "skipReason": "if no good upsell, brief reason; otherwise null"
}`;

    const aiInput = {
      cart: cartProducts.map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        category: p.category?.name || null,
        qty: items.find((i) => i.productId === p.id)?.qty ?? 1,
      })),
      candidates: topCandidates,
      customer: customerSummary,
      cartSubtotal: cartProducts.reduce((s, p) => {
        const qty = items.find((i) => i.productId === p.id)?.qty ?? 1;
        return s + p.price * qty;
      }, 0),
    };

    const raw = await callAI(systemPrompt, JSON.stringify(aiInput, null, 2), { signal: scope.signal });
    const aiResponse = parseAIJson(raw);
    const saved = await saveInsight(prisma, req.user.id, 'upsell', {
      items: items.map(item => ({ productId: item.productId, qty: item.qty ?? 1 })),
      ...(customerId ? { customerId } : {}),
      cartCount: cartProducts.length,
      candidateCount: topCandidates.length,
    }, aiResponse, scope.signal);
    scope.signal.throwIfAborted();

    return res.status(200).json({
      success: true,
      data: {
        ...aiResponse,
        source: 'ai',
        insightId: saved.id,
        generatedAt: saved.generatedAt,
      },
    });
  } catch (error: any) {
    if (scope.signal.aborted || res.destroyed) return;
    return res.status(error.status || 502).json({
      success: false,
      message: error?.message || 'Failed to generate upsell recommendations',
    });
  } finally { scope.dispose(); }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const insights = await ownedInsights(prisma, req.user.id, 'upsell', req.query.limit);
    return res.json({ success: true, data: insights.map(row => {
      const payload = JSON.parse(row.payload);
      return { id: row.id, type: row.type, generatedAt: row.generatedAt, input: payload.input, output: payload.output };
    }) });
  } catch { return res.status(500).json({ success: false, message: 'Saved upsell reports could not be loaded.' }); }
});

export default router;

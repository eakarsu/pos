import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { callAI, parseAIJson } from '../../services/aiService';

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

router.post('/', async (req: Request, res: Response) => {
  const items: CartItem[] = Array.isArray(req.body?.items) ? req.body.items : [];
  const customerId: string | undefined = req.body?.customerId;

  if (items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'items[] is required and must be non-empty' });
  }

  try {
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

    // Co-purchase signal: sales in the last 90 days that contained any cart product
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const coPurchaseSales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
        saleItems: { some: { productId: { in: cartProducts.map((p) => p.id) } } },
      },
      select: {
        id: true,
        saleItems: {
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
      for (const item of sale.saleItems) {
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

    let aiResponse: any = null;
    let aiError: string | null = null;
    try {
      const raw = await callAI(systemPrompt, JSON.stringify(aiInput, null, 2));
      aiResponse = parseAIJson(raw);
    } catch (e: any) {
      aiError = e?.message || String(e);
      console.warn('[ai/upsell] AI call failed:', aiError);
    }

    // Persist for telemetry / future review
    await prisma.aiInsight
      .create({
        data: {
          type: 'upsell',
          payload: JSON.stringify({
            input: { cartCount: cartProducts.length, candidateCount: topCandidates.length },
            output: aiResponse,
            error: aiError,
          }),
        },
      })
      .catch((err) => console.warn('[ai/upsell] failed to log AiInsight:', err?.message));

    if (!aiResponse) {
      // Graceful fallback: top-3 highest co-purchase candidates
      const fallback = topCandidates.slice(0, 3).map((c) => ({
        productId: c.productId,
        name: c.name,
        price: c.price,
        rationale: `Frequently bought with items in this cart (${c.count} times in last 90 days)`,
        cashierScript: `Would you like to add ${c.name} for $${c.price.toFixed(2)}?`,
      }));
      return res.status(200).json({
        success: true,
        data: {
          recommendations: fallback,
          skipReason: fallback.length === 0 ? 'No co-purchase data yet' : null,
          source: 'fallback',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...aiResponse,
        source: 'ai',
      },
    });
  } catch (error: any) {
    console.error('AI upsell error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to generate upsell recommendations',
    });
  }
});

export default router;

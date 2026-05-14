import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/ai/copilot
 * Conversational POS copilot. Cashier sends natural language; LLM returns
 * a tool plan: { intent, items?: [{name, qty}], discount?, customer?, summary }.
 *
 * Body: { message: string, context?: any }
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const started = Date.now();
  const { message, context } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'message (string) is required' });
  }

  try {
    // Ground the model with active products so it can match item names.
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, price: true },
      take: 200,
    });

    const systemPrompt = `You are a Point-of-Sale cashier copilot. Translate natural-language commands
into a structured action plan. Return ONLY JSON with this schema:
{
  "intent": "ring_up" | "lookup" | "discount" | "refund" | "loyalty" | "unknown",
  "items": [{"productId": "...", "name": "...", "qty": 1, "unitPrice": 0}],
  "discountPercent": 0,
  "customerHint": "optional name/email/phone",
  "loyalty": { "applyPoints": 0 },
  "summary": "1-sentence confirmation suitable for the cashier"
}
Match item names to the provided products. If unsure, set intent to "unknown".`;

    const userMessage = JSON.stringify({
      cashierMessage: message,
      context: context || {},
      products: products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price })).slice(0, 80),
    });

    const raw = await callAI(systemPrompt, userMessage, { temperature: 0.2, maxTokens: 1024 });
    const plan = parseAIJson(raw);

    await prisma.aiResult.create({
      data: {
        feature: 'copilot',
        userId: req.user?.id,
        input: { message, context: context || null },
        output: plan as any,
        model: 'anthropic/claude-3-5-sonnet-20241022',
        durationMs: Date.now() - started,
        status: 'success',
      },
    });

    res.json({ success: true, data: plan });
  } catch (err: any) {
    await prisma.aiResult
      .create({
        data: {
          feature: 'copilot',
          userId: req.user?.id,
          input: { message, context: context || null },
          output: {},
          status: 'error',
          errorMessage: err.message,
          durationMs: Date.now() - started,
        },
      })
      .catch(() => {});
    res.status(500).json({ success: false, message: err.message || 'copilot failure' });
  }
});

export default router;

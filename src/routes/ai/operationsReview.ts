import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: AuthRequest, res: Response) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt || prompt.length > 4000) {
    return res.status(400).json({ success: false, message: 'prompt must contain 1-4000 characters' });
  }

  try {
    const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/+$/, '');
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    const model = String(process.env.OPENROUTER_MODEL || '').trim();
    if (baseUrl !== 'https://openrouter.ai/api/v1' || !apiKey || !model) {
      return res.status(503).json({ success: false, message: 'Exact OpenRouter configuration is required' });
    }

    const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'ElitePOS operations review',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Review deidentified point-of-sale operations evidence. Identify control gaps, reconciliation risks, and human-review steps. Never invent transaction facts or authorize a financial action.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 650,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const provider = await providerResponse.json() as any;
    const content = String(provider.choices?.[0]?.message?.content || '').trim();
    if (!providerResponse.ok || !provider.id || !content) {
      throw new Error(`OpenRouter request failed with HTTP ${providerResponse.status}`);
    }
    const providerReceipt = {
      requestId: String(provider.id),
      provider: String(provider.provider || 'openrouter'),
      upstreamModel: String(provider.model || model),
      created: Number(provider.created || 0),
    };
    const saved = await prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
      'INSERT INTO runtime_ai_interactions(user_id,feature,input,output,model,provider_receipt) VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6::jsonb) RETURNING id',
      req.user!.id,
      'pos-operations-review',
      JSON.stringify(req.body || {}),
      JSON.stringify({ content }),
      model,
      JSON.stringify(providerReceipt),
    );
    const interactionId = Number(saved[0]?.id);
    if (!Number.isSafeInteger(interactionId) || interactionId < 1) {
      throw new Error('Persisted interaction identifier is invalid');
    }
    return res.json({ content, model, providerReceipt, interactionId, feature: 'pos-operations-review' });
  } catch (error: any) {
    return res.status(502).json({ success: false, message: error.message || 'AI operations review failed' });
  }
});

export default router;

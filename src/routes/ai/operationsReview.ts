import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { aiRequestScope, saveAI } from '../../services/aiCancellation';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: AuthRequest, res: Response) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt || prompt.length > 4000) {
    return res.status(400).json({ success: false, message: 'prompt must contain 1-4000 characters' });
  }

  const scope = aiRequestScope(req, res);
  try {
    scope.signal.throwIfAborted();
    const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/+$/, '');
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    const model = String(process.env.OPENROUTER_MODEL || '').trim();
    const localFixture = process.env.NODE_ENV === 'test' && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/api\/v1$/.test(baseUrl);
    if ((baseUrl !== 'https://openrouter.ai/api/v1' && !localFixture) || !apiKey || !model) {
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
      signal: AbortSignal.any([scope.signal, AbortSignal.timeout(90_000)]),
    });
    const provider = await providerResponse.json() as any;
    scope.signal.throwIfAborted();
    const content = String(provider.choices?.[0]?.message?.content || '').trim();
    if (!providerResponse.ok || !provider.id || !content || provider.choices?.[0]?.finish_reason === 'length' || provider.choices?.[0]?.message?.refusal) {
      throw new Error(`OpenRouter request failed with HTTP ${providerResponse.status}`);
    }
    const providerReceipt = {
      requestId: String(provider.id),
      provider: String(provider.provider || 'openrouter'),
      upstreamModel: String(provider.model || model),
      created: Number(provider.created || 0),
    };
    const saved = await saveAI(prisma, scope.signal, transaction => transaction.$queryRawUnsafe<Array<{ id: bigint }>>(
      'INSERT INTO runtime_ai_interactions(user_id,feature,input,output,model,provider_receipt) VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6::jsonb) RETURNING id',
      req.user!.id,
      'pos-operations-review',
      JSON.stringify(req.body || {}),
      JSON.stringify({ content }),
      model,
      JSON.stringify(providerReceipt),
    ));
    const interactionId = Number(saved[0]?.id);
    if (!Number.isSafeInteger(interactionId) || interactionId < 1) {
      throw new Error('Persisted interaction identifier is invalid');
    }
    scope.signal.throwIfAborted();
    return res.json({ content, model, providerReceipt, interactionId, feature: 'pos-operations-review' });
  } catch (error: any) {
    if (scope.signal.aborted || res.destroyed) return;
    return res.status(502).json({ success: false, message: 'OpenRouter could not complete the operations review. Check the connection and try again.' });
  } finally { scope.dispose(); }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const rows = await prisma.$queryRaw<Array<{ id: bigint; input: any; output: any; model: string; provider_receipt: any; created_at: Date }>>`SELECT id,input,output,model,provider_receipt,created_at FROM runtime_ai_interactions
      WHERE user_id=${req.user.id} AND feature='pos-operations-review' ORDER BY created_at DESC,id DESC LIMIT 50`;
    return res.json({ success: true, data: rows.map(row => ({ id: String(row.id), input: row.input, output: row.output, model: row.model, providerReceipt: row.provider_receipt,
      createdAt: row.created_at })) });
  } catch { return res.status(500).json({ success: false, message: 'Saved operations reviews could not be loaded.' }); }
});

export default router;

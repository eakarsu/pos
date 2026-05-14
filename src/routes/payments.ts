import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

/**
 * Integrated Payment & Receipting routes.
 *
 * Endpoints:
 *   POST /api/v1/payments/intent    — create payment intent (Stripe Terminal stub)
 *   POST /api/v1/payments/confirm   — confirm + record sale link
 *   POST /api/v1/payments/receipt   — email digital receipt
 *
 * TODO: configure credentials — STRIPE_SECRET_KEY, SENDGRID_API_KEY.
 */
const router = Router();

interface Intent {
  id: string;
  saleId?: string;
  amountCents: number;
  currency: string;
  status: 'requires_action' | 'succeeded' | 'failed';
  terminalReader?: string;
  createdAt: string;
}

const intents = new Map<string, Intent>();

router.post('/intent', authenticate, (req: AuthRequest, res: Response) => {
  const { amountCents, currency = 'usd', saleId, terminalReader } = req.body || {};
  if (!amountCents) return res.status(400).json({ success: false, message: 'amountCents required' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({
      success: false,
      message: 'STRIPE_SECRET_KEY not configured. TODO: configure credentials.',
    });
  }

  const id = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const intent: Intent = {
    id,
    saleId,
    amountCents,
    currency,
    status: 'requires_action',
    terminalReader,
    createdAt: new Date().toISOString(),
  };
  intents.set(id, intent);
  res.json({ success: true, intent });
});

router.post('/confirm', authenticate, (req: AuthRequest, res: Response) => {
  const { intentId } = req.body || {};
  const intent = intents.get(intentId);
  if (!intent) return res.status(404).json({ success: false, message: 'intent not found' });
  intent.status = 'succeeded';
  intents.set(intentId, intent);
  res.json({ success: true, intent });
});

router.post('/receipt', authenticate, (req: AuthRequest, res: Response) => {
  const { saleId, customerEmail, lineItems = [], totalAmount } = req.body || {};
  if (!saleId || !customerEmail) {
    return res.status(400).json({ success: false, message: 'saleId and customerEmail required' });
  }
  if (!process.env.SENDGRID_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'SENDGRID_API_KEY not configured. TODO: configure credentials.',
    });
  }
  // Lean v0: record only — real send wired when credentials added.
  res.json({
    success: true,
    receipt: {
      saleId,
      customerEmail,
      totalAmount,
      lineItems,
      issuedAt: new Date().toISOString(),
      delivered: 'queued',
    },
  });
});

export default router;

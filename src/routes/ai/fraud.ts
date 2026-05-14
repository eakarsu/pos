import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/ai/fraud/score
 * Body: { saleId: string }
 * Computes risk signals (refund frequency, void rate, after-hours discount,
 * cashier outlier vs peers) and asks the LLM for a fraud risk score 0-100.
 */
router.post('/score', async (req: AuthRequest, res: Response) => {
  const started = Date.now();
  const { saleId } = req.body || {};
  if (!saleId) return res.status(400).json({ success: false, message: 'saleId required' });

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        payments: true,
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    if (!sale) return res.status(404).json({ success: false, message: 'sale not found' });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [refundCount, voidCount, cashierStats] = await Promise.all([
      prisma.return.count({ where: { sale: { userId: sale.userId, createdAt: { gte: since } } } }),
      prisma.sale.count({
        where: { userId: sale.userId, status: 'CANCELLED', createdAt: { gte: since } },
      }),
      prisma.sale.aggregate({
        _avg: { discountAmount: true, totalAmount: true },
        _count: { id: true },
        where: { userId: sale.userId, createdAt: { gte: since } },
      }),
    ]);

    const hour = sale.createdAt.getHours();
    const afterHours = hour < 7 || hour > 22;
    const discountPct = sale.totalAmount > 0 ? sale.discountAmount / sale.totalAmount : 0;

    const signals = {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      total: sale.totalAmount,
      discountAmount: sale.discountAmount,
      discountPct: Math.round(discountPct * 100) / 100,
      hour,
      afterHours,
      cashier: sale.user,
      cashierAvgDiscount: cashierStats._avg.discountAmount ?? 0,
      cashierAvgTicket: cashierStats._avg.totalAmount ?? 0,
      cashierTransactions30d: cashierStats._count.id,
      refundCount30d: refundCount,
      voidCount30d: voidCount,
      itemCount: sale.items.length,
      paymentCount: sale.payments.length,
      paymentMethods: sale.payments.map((p) => p.method),
    };

    const systemPrompt = `You are a retail loss-prevention analyst. Score the risk that this sale is
fraudulent (employee fraud, sweethearting, refund abuse). Return ONLY JSON:
{
  "riskScore": 0-100,
  "level": "low|medium|high|critical",
  "topReasons": ["..."],
  "recommendedAction": "monitor|review|investigate|alert_manager",
  "confidence": "low|medium|high"
}`;

    const raw = await callAI(systemPrompt, JSON.stringify(signals, null, 2), {
      temperature: 0.1,
      maxTokens: 512,
    });
    const verdict: any = parseAIJson(raw);

    const saved = await prisma.aiResult.create({
      data: {
        feature: 'fraud',
        userId: req.user?.id,
        input: signals as any,
        output: verdict,
        model: 'anthropic/claude-3-5-sonnet-20241022',
        durationMs: Date.now() - started,
        status: 'success',
      },
    });

    // Optional: emit socket.io alert for high/critical risk
    const io = req.app.get('io');
    if (io && (verdict.level === 'high' || verdict.level === 'critical')) {
      io.emit('fraud-alert', { saleId, ...verdict });
    }

    res.json({ success: true, data: { id: saved.id, signals, verdict } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Paginated recent fraud scores (heatmap data).
router.get('/scores', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
    const [items, total] = await Promise.all([
      prisma.aiResult.findMany({
        where: { feature: 'fraud' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiResult.count({ where: { feature: 'fraud' } }),
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

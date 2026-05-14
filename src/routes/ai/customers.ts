import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { callAI, parseAIJson } from '../../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * POST /api/v1/ai/customers
 * Analyzes customer purchase patterns using RFM segmentation.
 * Returns segmented insights: top customers, churn risk, upsell opportunities.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const since90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // All active customers with aggregate stats
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
        totalSpent: true,
        createdAt: true,
        sales: {
          where: { status: { not: 'CANCELLED' } },
          select: { createdAt: true, totalAmount: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const totalCustomers = customers.length;

    // Compute RFM per customer
    const rfmData = customers.map((c) => {
      const sales = c.sales;
      const frequency = sales.length;
      const monetary = c.totalSpent;
      const lastSaleDate = sales.length > 0 ? sales[0].createdAt : null;
      const daysSinceLastPurchase = lastSaleDate
        ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const salesLast30 = sales.filter((s) => s.createdAt >= since30);
      const salesLast90 = sales.filter((s) => s.createdAt >= since90);

      // Segment classification
      let segment: string;
      if (frequency === 0 || daysSinceLastPurchase === null) {
        segment = 'never_purchased';
      } else if (daysSinceLastPurchase <= 30 && frequency >= 3 && monetary >= 200) {
        segment = 'vip';
      } else if (daysSinceLastPurchase <= 30 && frequency >= 2) {
        segment = 'loyal';
      } else if (daysSinceLastPurchase <= 30) {
        segment = 'recent';
      } else if (daysSinceLastPurchase <= 60 && frequency >= 2) {
        segment = 'at_risk';
      } else if (daysSinceLastPurchase > 60) {
        segment = 'lapsed';
      } else {
        segment = 'new';
      }

      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        segment,
        recencyDays: daysSinceLastPurchase,
        frequency,
        monetary: Math.round(monetary * 100) / 100,
        loyaltyPoints: c.loyaltyPoints,
        avgOrderValue: frequency > 0 ? Math.round((monetary / frequency) * 100) / 100 : 0,
        transactionsLast30: salesLast30.length,
        transactionsLast90: salesLast90.length,
        revenueLast30: Math.round(salesLast30.reduce((s, x) => s + x.totalAmount, 0) * 100) / 100,
        memberSinceDays: Math.floor((now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

    // Segment counts
    const segments: Record<string, number> = {};
    for (const c of rfmData) {
      segments[c.segment] = (segments[c.segment] ?? 0) + 1;
    }

    // Top customers by monetary value
    const topCustomers = [...rfmData].sort((a, b) => b.monetary - a.monetary).slice(0, 10);

    // Churn risk: at_risk + lapsed
    const churnRisk = rfmData.filter((c) => c.segment === 'at_risk' || c.segment === 'lapsed');

    // Upsell opportunities: recent or loyal with below-average order value
    const avgOrderValue =
      rfmData.filter((c) => c.frequency > 0).reduce((s, c) => s + c.avgOrderValue, 0) /
      Math.max(rfmData.filter((c) => c.frequency > 0).length, 1);

    const upsellOpportunities = rfmData.filter(
      (c) => (c.segment === 'recent' || c.segment === 'loyal') && c.avgOrderValue < avgOrderValue
    );

    const summary = {
      totalCustomers,
      segments,
      averageOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalRevenue: Math.round(rfmData.reduce((s, c) => s + c.monetary, 0) * 100) / 100,
      topCustomers: topCustomers.slice(0, 5),
      churnRiskCount: churnRisk.length,
      upsellOpportunityCount: upsellOpportunities.length,
    };

    const systemPrompt = `You are a customer analytics expert for a retail Point-of-Sale system.
Analyze the RFM (Recency, Frequency, Monetary) customer segmentation data.
Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence overview of customer base health",
  "segmentInsights": {
    "vip": {"count": 0, "insight": "...", "action": "..."},
    "loyal": {"count": 0, "insight": "...", "action": "..."},
    "at_risk": {"count": 0, "insight": "...", "action": "..."},
    "lapsed": {"count": 0, "insight": "...", "action": "..."},
    "recent": {"count": 0, "insight": "...", "action": "..."}
  },
  "topCustomerInsights": ["..."],
  "churnPreventionStrategies": [
    {"strategy": "...", "targetSegment": "...", "expectedImpact": "..."}
  ],
  "upsellOpportunities": [
    {"tactic": "...", "targetSegment": "...", "potentialRevenue": "..."}
  ],
  "loyaltyProgramRecommendations": ["..."],
  "revenueProjections": {
    "ifChurnPrevented": "...",
    "ifUpsellSucceeds": "..."
  }
}`;

    const aiInput = {
      summary,
      churnRiskSample: churnRisk.slice(0, 20).map(({ id: _, email: __, ...rest }) => rest),
      upsellSample: upsellOpportunities.slice(0, 20).map(({ id: _, email: __, ...rest }) => rest),
    };

    const aiResponseRaw = await callAI(systemPrompt, JSON.stringify(aiInput, null, 2));
    const aiResponse = parseAIJson(aiResponseRaw);

    // Persist insight
    await prisma.aiInsight.create({
      data: {
        type: 'customers',
        payload: JSON.stringify({ input: { totalCustomers, segments }, output: aiResponse }),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        customerSummary: summary,
        segments: rfmData.reduce<Record<string, typeof rfmData>>((acc, c) => {
          if (!acc[c.segment]) acc[c.segment] = [];
          acc[c.segment].push(c);
          return acc;
        }, {}),
        topCustomers,
        churnRisk: churnRisk.slice(0, 20),
        upsellOpportunities: upsellOpportunities.slice(0, 20),
        aiInsights: aiResponse,
      },
    });
  } catch (error: any) {
    console.error('AI customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate customer analytics',
    });
  }
});

// GET /api/v1/ai/customers - Return most recent customer insights
router.get('/', async (req: Request, res: Response) => {
  try {
    const insights = await prisma.aiInsight.findMany({
      where: { type: 'customers' },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      success: true,
      data: insights.map((i) => ({
        id: i.id,
        type: i.type,
        generatedAt: i.generatedAt,
        insights: JSON.parse(i.payload).output,
      })),
    });
  } catch (error: any) {
    console.error('AI customers fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer insights' });
  }
});

export default router;

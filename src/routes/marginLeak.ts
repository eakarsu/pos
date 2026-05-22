import { Router } from 'express';

const router = Router();

router.post('/scan', (req, res) => {
  const basket = Array.isArray(req.body?.basket)
    ? req.body.basket
    : [
        { sku: 'LATTE', price: 5.5, cost: 2.1, discount: 0.5, wasteRisk: 8 },
        { sku: 'MUFFIN', price: 4, cost: 1.6, discount: 1.25, wasteRisk: 18 },
      ];
  const findings = basket.map((item: any) => {
    const price = Number(item.price || 0);
    const net = price - Number(item.discount || 0);
    const cost = Number(item.cost || 0);
    const margin = net ? ((net - cost) / net) * 100 : 0;
    const risk = Math.min(100, Math.max(0, 100 - margin + Number(item.wasteRisk || 0)));
    return {
      sku: item.sku || 'item',
      margin: Number(margin.toFixed(1)),
      risk: Math.round(risk),
      action: margin < 35 ? 'reduce discount or bundle with higher-margin item' : 'keep current pricing',
    };
  });
  res.json({ findings, highRiskCount: findings.filter((row) => row.risk >= 70).length });
});

export default router;

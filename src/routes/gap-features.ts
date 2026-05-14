// === Batch 11 Gaps & Frontend Mounts ===
// Gap features (AI counterparts + Non-AI features) for pos.
// Lazy gap_features table (in-memory), OpenRouter via native fetch.

import express from 'express';
const router = express.Router();

const gapFeatures = new Map<string, Array<{ at: string; payload: any }>>();

async function llm(systemPrompt: string, userMsg: string, maxTokens = 1400): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e: any = new Error('OPENROUTER_API_KEY not configured'); e.status = 503; throw e; }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'pos Gap Features' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], max_tokens: maxTokens }),
  });
  const data: any = await r.json();
  if (data?.error) throw new Error(data.error.message || 'LLM error');
  return data?.choices?.[0]?.message?.content || '';
}

function track(slug: string, payload: any) {
  const list = gapFeatures.get(slug) || [];
  list.push({ at: new Date().toISOString(), payload });
  gapFeatures.set(slug, list);
}

function safe(res: any, e: any) { return res.status((e && e.status) || 500).json({ error: (e && e.message) || 'request failed' }); }

// ---- AI Gap Counterparts ----

router.post('/gap-product-recommendation', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You recommend complementary products at checkout based on cart items and purchase history.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('product-recommendation', { keys: Object.keys(body) });
    res.json({ recommendations: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-demand-forecasting', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You forecast demand for SKUs over the next 30 days using sales history and seasonality.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('demand-forecasting', { keys: Object.keys(body) });
    res.json({ forecast: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-dynamic-pricing', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You recommend price adjustments and markdowns based on demand, inventory, and elasticity.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('dynamic-pricing', { keys: Object.keys(body) });
    res.json({ pricing: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-drawer-anomaly', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You detect anomalies in cash drawer activity (voids, overrides, no-sale events) and flag suspicious patterns.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('drawer-anomaly', { keys: Object.keys(body) });
    res.json({ flags: out });
  } catch (e: any) { safe(res, e); }
});

// ---- Non-AI Gap Features ----

router.post('/gap-payment-terminal', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'payment-terminal_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('payment-terminal', record);
  res.json({ terminal: record, status: 'recorded' });
});

router.post('/gap-receipt-printing', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'receipt-printing_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('receipt-printing', record);
  res.json({ receipt: record, status: 'recorded' });
});

router.post('/gap-multi-location', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'multi-location_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('multi-location', record);
  res.json({ location: record, status: 'recorded' });
});

router.post('/gap-employee-shifts', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'employee-shifts_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('employee-shifts', record);
  res.json({ shift: record, status: 'recorded' });
});

router.post('/gap-tax-jurisdictions', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'tax-jurisdictions_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('tax-jurisdictions', record);
  res.json({ taxCalc: record, status: 'recorded' });
});

router.post('/gap-loyalty-giftcards', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'loyalty-giftcards_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('loyalty-giftcards', record);
  res.json({ card: record, status: 'recorded' });
});

router.get('/gap-features/_audit', (req, res) => {
  const rows: Array<{ feature: string; events: number }> = [];
  for (const [k, v] of gapFeatures.entries()) rows.push({ feature: k, events: v.length });
  res.json({ rows });
});

export default router;

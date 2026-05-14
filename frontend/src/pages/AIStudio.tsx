import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

type Tab = 'copilot' | 'reorder' | 'elasticity' | 'fraud' | 'history';

const AIStudio: React.FC = () => {
  const [tab, setTab] = useState<Tab>('copilot');

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Studio</h1>
        <div className="text-xs text-gray-500">model: anthropic/claude-3-5-sonnet · 20 req/hr</div>
      </header>

      <nav className="flex gap-2 border-b border-gray-200">
        {(['copilot', 'reorder', 'elasticity', 'fraud', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === 'copilot' && <CopilotPanel />}
      {tab === 'reorder' && <ReorderPanel />}
      {tab === 'elasticity' && <ElasticityPanel />}
      {tab === 'fraud' && <FraudPanel />}
      {tab === 'history' && <HistoryPanel />}
    </div>
  );
};

const CopilotPanel: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await apiService.request('/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setResult(res.data);
    } catch (e: any) {
      toast.error(e.message || 'copilot failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <p className="text-sm text-gray-600">
        Type a natural-language POS command. Example: "ring up 2 lattes and apply 10% discount".
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="ring up 2 lattes and apply loyalty"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
      >
        {loading ? 'Thinking...' : 'Send to Copilot'}
      </button>
      {result && (
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

const ReorderPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await apiService.request('/ai/reorder', { method: 'POST' });
      setResult(res.data);
      toast.success('Reorder plan generated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <p className="text-sm text-gray-600">
        Predictive reorder agent: analyzes 30-day velocity vs current inventory and drafts a PO.
      </p>
      <button
        onClick={run}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Generate Reorder Plan'}
      </button>
      {result?.plan && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{result.plan.summary}</p>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Name</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-left p-2">Urgency</th>
                <th className="text-left p-2">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {(result.plan.lines || []).map((line: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{line.sku}</td>
                  <td className="p-2">{line.name}</td>
                  <td className="p-2 text-right">{line.suggestedQty}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        line.urgency === 'high'
                          ? 'bg-red-100 text-red-700'
                          : line.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {line.urgency}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{line.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ElasticityPanel: React.FC = () => {
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    apiService.getProducts({ limit: 100 }).then((r: any) => setProducts(r.data?.products || r.data || []));
  }, []);

  const run = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await apiService.request('/ai/elasticity', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      setResult(res.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <p className="text-sm text-gray-600">
        Estimate price elasticity for a product based on historical sales.
      </p>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      >
        <option value="">Select a product…</option>
        {products.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.sku})
          </option>
        ))}
      </select>
      <button
        onClick={run}
        disabled={!productId || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Estimate Elasticity'}
      </button>
      {result?.plan && (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Coefficient:</span>{' '}
            {result.plan.elasticityCoefficient} ({result.plan.interpretation})
          </div>
          <div>
            <span className="font-medium">Recommended band:</span> $
            {result.plan.recommendedPriceBand?.low} – ${result.plan.recommendedPriceBand?.high}{' '}
            ({result.plan.recommendedPriceBand?.expectedLift})
          </div>
          <div className="text-gray-600">{result.plan.rationale}</div>
        </div>
      )}
    </div>
  );
};

const FraudPanel: React.FC = () => {
  const [saleId, setSaleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    apiService.request('/ai/fraud/scores?pageSize=10').then((r: any) => setScores(r.data || []));
  }, [result]);

  const score = async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const res = await apiService.request('/ai/fraud/score', {
        method: 'POST',
        body: JSON.stringify({ saleId }),
      });
      setResult(res.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <p className="text-sm text-gray-600">
        Real-time fraud scoring on a sale (refund/void rate, after-hours discounts, cashier outliers).
      </p>
      <input
        value={saleId}
        onChange={(e) => setSaleId(e.target.value)}
        placeholder="Sale ID (cuid)"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      />
      <button
        onClick={score}
        disabled={!saleId || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
      >
        {loading ? 'Scoring…' : 'Score Sale'}
      </button>
      {result?.verdict && (
        <div className="text-sm">
          <div className="font-medium">
            Risk: {result.verdict.riskScore} / 100 — level: {result.verdict.level}
          </div>
          <div>Action: {result.verdict.recommendedAction}</div>
          <ul className="mt-1 list-disc list-inside text-gray-700">
            {(result.verdict.topReasons || []).map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <h3 className="text-sm font-semibold pt-4">Recent fraud scores</h3>
      <ul className="text-xs space-y-1">
        {scores.map((s: any) => {
          const out = typeof s.output === 'string' ? JSON.parse(s.output) : s.output;
          return (
            <li key={s.id} className="border-b py-1">
              {new Date(s.createdAt).toLocaleString()} — risk {out.riskScore} ({out.level})
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const HistoryPanel: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1 });
  const [feature, setFeature] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (feature) qs.set('feature', feature);
    apiService.request(`/ai/results?${qs.toString()}`).then((r: any) => {
      setItems(r.data || []);
      setPagination(r.pagination || { totalPages: 1 });
    });
  }, [page, feature]);

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={feature}
          onChange={(e) => {
            setFeature(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="">All features</option>
          <option value="copilot">copilot</option>
          <option value="reorder">reorder</option>
          <option value="elasticity">elasticity</option>
          <option value="fraud">fraud</option>
        </select>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2">When</th>
            <th className="text-left p-2">Feature</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i: any) => (
            <tr key={i.id} className="border-t">
              <td className="p-2">{new Date(i.createdAt).toLocaleString()}</td>
              <td className="p-2">{i.feature}</td>
              <td className="p-2">{i.status}</td>
              <td className="p-2 text-right">{i.durationMs} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-xs text-gray-500">
          page {page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          disabled={page >= pagination.totalPages}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AIStudio;

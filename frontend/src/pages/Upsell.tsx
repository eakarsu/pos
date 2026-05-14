import React, { useEffect, useState } from 'react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

interface CartLine {
  productId: string;
  qty: number;
}

interface Recommendation {
  productId: string;
  name: string;
  price: number;
  rationale: string;
  cashierScript: string;
}

interface UpsellResponse {
  recommendations: Recommendation[];
  skipReason: string | null;
  source: 'ai' | 'fallback';
}

const Upsell: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartLine[]>([{ productId: '', qty: 1 }]);
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UpsellResponse | null>(null);

  useEffect(() => {
    apiService.getProducts({ limit: 100 }).then((r: any) => {
      setProducts(r.data?.products || r.data || []);
    });
  }, []);

  const addRow = () => setCart((c) => [...c, { productId: '', qty: 1 }]);
  const removeRow = (idx: number) =>
    setCart((c) => (c.length > 1 ? c.filter((_, i) => i !== idx) : c));
  const updateRow = (idx: number, patch: Partial<CartLine>) =>
    setCart((c) => c.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const submit = async () => {
    const items = cart
      .filter((c) => c.productId)
      .map((c) => ({ productId: c.productId, qty: Number(c.qty) || 1 }));
    if (items.length === 0) {
      toast.error('Add at least one cart item');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const body: any = { items };
      if (customerId) body.customerId = customerId;
      const res = await apiService.request('/ai/upsell', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(res.data);
    } catch (e: any) {
      toast.error(e.message || 'upsell failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Upsell</h1>
        <div className="text-xs text-gray-500">model: anthropic/claude-3-5-sonnet · 20 req/hr</div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <p className="text-sm text-gray-600">
          Suggest checkout-time add-ons. Pick the cart products and (optionally) a customer ID.
        </p>

        <div className="space-y-2">
          {cart.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={row.productId}
                onChange={(e) => updateRow(idx, { productId: e.target.value })}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select a product…</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={row.qty}
                onChange={(e) => updateRow(idx, { qty: Number(e.target.value) })}
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={() => removeRow(idx)}
                disabled={cart.length === 1}
                className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={addRow} className="text-sm text-blue-600 hover:underline">
            + Add line
          </button>
        </div>

        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Customer ID (optional)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Get Upsell Suggestions'}
        </button>

        {result && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              source:{' '}
              <span
                className={`px-2 py-0.5 rounded ${
                  result.source === 'ai'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {result.source}
              </span>
              {result.skipReason && (
                <span className="ml-2 text-gray-600">— {result.skipReason}</span>
              )}
            </div>
            {result.recommendations.length === 0 ? (
              <div className="text-sm text-gray-600">No upsell candidates.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Product</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-left p-2">Rationale</th>
                    <th className="text-left p-2">Cashier Script</th>
                  </tr>
                </thead>
                <tbody>
                  {result.recommendations.map((r) => (
                    <tr key={r.productId} className="border-t">
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 text-right">${Number(r.price).toFixed(2)}</td>
                      <td className="p-2 text-gray-600">{r.rationale}</td>
                      <td className="p-2 italic text-gray-700">&ldquo;{r.cashierScript}&rdquo;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upsell;

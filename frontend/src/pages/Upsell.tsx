import React, { useEffect, useState } from 'react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';
import useNativeAIRequest from '../hooks/useNativeAIRequest';
import AIResponseReport from '../components/AIResponseReport';

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
  insightId?: string;
  generatedAt?: string;
  recommendations: Recommendation[];
  skipReason: string | null;
  source: 'ai' | 'fallback';
}

const Upsell: React.FC<{ initial?: { items?: CartLine[]; customerId?: string } }> = ({ initial = {} }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartLine[]>(initial.items?.length ? initial.items.map(item => ({ productId: item.productId, qty: item.qty ?? 1 })) : [{ productId: '', qty: 1 }]);
  const [customerId, setCustomerId] = useState(initial.customerId || '');
  const [customers, setCustomers] = useState<any[]>([]);
  const [referenceError, setReferenceError] = useState('');
  const request = useNativeAIRequest<UpsellResponse>();
  const { loading, result } = request;

  useEffect(() => {
    let active = true;
    Promise.all([apiService.getProducts({ limit: 100 }), apiService.getCustomers({ limit: 100 })]).then(([productResponse, customerResponse]) => {
      if (!active) return;
      const productRows = productResponse.data?.products ?? productResponse.data;
      const customerRows = customerResponse.data?.customers ?? customerResponse.data;
      setProducts(Array.isArray(productRows) ? productRows : []);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
    }).catch(error => { if (active) setReferenceError(error.message || 'Could not load saved checkout references.'); });
    return () => { active = false; };
  }, []);

  const addRow = () => setCart((c) => [...c, { productId: '', qty: 1 }]);
  const removeRow = (idx: number) =>
    setCart((c) => (c.length > 1 ? c.filter((_, i) => i !== idx) : c));
  const updateRow = (idx: number, patch: Partial<CartLine>) =>
    setCart((c) => c.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const referencesReady = cart.length > 0 && cart.length <= 40 && cart.every(row => products.some(product => product.id === row.productId) && Number.isInteger(Number(row.qty)) && Number(row.qty) >= 1 && Number(row.qty) <= 1000) && (!customerId || customers.some(customer => customer.id === customerId));
  const submit = async () => {
    if (!referencesReady) { toast.error('Select available saved references and valid whole-number quantities.'); return; }
    const items = cart.map(c => ({ productId: c.productId, qty: Number(c.qty) }));
    if (items.length === 0) {
      toast.error('Add at least one cart item');
      return;
    }
    await request.run(async signal => {
      const body: any = { items };
      if (customerId) body.customerId = customerId;
      const res = await apiService.request('/ai/upsell', { method: 'POST', body: JSON.stringify(body), signal });
      return res.data;
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Upsell</h1>
        <div className="text-xs text-gray-500">Authenticated OpenRouter report · 20 generations/hour</div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <p className="text-sm text-gray-600">
          Review checkout-time add-ons using saved products and an optional saved customer. Suggestions do not change the cart or complete a sale.
        </p>

        <div className="flex flex-wrap gap-2" aria-label="Fill every AI field">
          {['One unit per line', 'Two units per line', 'Three units per line'].map((label, index) => <button key={label} disabled={loading || !products.length} onClick={() => {
            setCart(rows => rows.map(row => ({ productId: products.some(product => product.id === row.productId) ? row.productId : products[0]?.id || '', qty: index + 1 })));
            setCustomerId(value => customers.some(customer => customer.id === value) ? value : customers[0]?.id || '');
            request.clear();
          }} className="px-3 py-2 border rounded-md text-sm disabled:opacity-50">Fill all · {label}</button>)}
        </div>
        <p className="text-xs text-gray-500">Examples fill each editable cart quantity and reference from saved records. Select another real record if needed; no example creates products, customers, or a checkout.</p>
        {!products.length && <p role="status" className="text-sm text-gray-600">{referenceError || 'No saved products are available. Add products through the existing Products workflow before generating.'}</p>}
        {!customers.length && <p className="text-xs text-gray-500">No saved customer is available; the optional customer field remains empty.</p>}
        <div className="space-y-2">
          {cart.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                aria-label={`Cart product ${idx + 1}`}
                disabled={loading}
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
                aria-label={`Cart quantity ${idx + 1}`}
                disabled={loading}
                type="number"
                min={1}
                value={row.qty}
                onChange={(e) => updateRow(idx, { qty: Number(e.target.value) })}
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={() => removeRow(idx)}
                disabled={loading || cart.length === 1}
                className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
          <button disabled={loading} onClick={addRow} className="text-sm text-blue-600 hover:underline">
            + Add line
          </button>
        </div>

        <label className="block space-y-1 text-sm"><span className="font-medium">Saved customer (optional)</span><select value={customerId} disabled={loading} onChange={event => setCustomerId(event.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"><option value="">No customer context</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select></label>

        {!referencesReady && products.length > 0 && <p role="status" className="text-sm text-gray-600">Select an available saved product for every line, a valid quantity, and an available saved customer when customer context is selected.</p>}
        <button
          onClick={submit}
          disabled={loading || !referencesReady}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate with OpenRouter'}
        </button>

        {loading && <button onClick={request.cancel} className="ml-2 px-4 py-2 border rounded-md text-sm">Cancel request</button>}
        {request.error && <p role="alert" className="text-sm text-red-700">{request.error}</p>}
        {request.status && <p role="status" className="text-sm text-gray-600">{request.status}</p>}
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
            {result.insightId && <p className="text-xs text-gray-500">Saved report: {result.insightId} · {result.generatedAt ? new Date(result.generatedAt).toLocaleString() : 'Saved'}</p>}
            <AIResponseReport title="Checkout add-on review" value={{ recommendations: (Array.isArray(result.recommendations) ? result.recommendations : []).map(item => ({ product: item.name, price: `$${Number(item.price).toFixed(2)}`, rationale: item.rationale, cashierScript: item.cashierScript })), ...(result.skipReason ? { reviewNote: result.skipReason } : {}) }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Upsell;

import React, { useEffect, useState } from 'react';
import { apiService } from '../utils/api';
import useNativeAIRequest from '../hooks/useNativeAIRequest';
import AIResponseReport from '../components/AIResponseReport';
import Upsell from './Upsell';

type Tab = 'copilot' | 'reorder' | 'elasticity' | 'fraud' | 'insights' | 'inventory' | 'customers' | 'operations-review' | 'upsell' | 'history';
const toolLabels: Record<Tab, string> = { copilot: 'Copilot', reorder: 'Reorder', elasticity: 'Elasticity', fraud: 'Fraud', insights: 'Sales insights', inventory: 'Inventory analytics', customers: 'Customer analytics', 'operations-review': 'Operations review', upsell: 'Upsell', history: 'History' };
type AIRequest = ReturnType<typeof useNativeAIRequest<any>>;
const fieldClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm';
export const reviewExamples = [
  { label: 'Operating review', focus: 'Review the retained records for the next operating period. Explain evidence, uncertainty, practical options, and the checks a manager should complete before acting.' },
  { label: 'Risk review', focus: 'Identify risks supported by the retained records, missing evidence, and conservative alternatives. Separate measured facts from model estimates and require human review before operational changes.' },
  { label: 'Action plan', focus: 'Prepare a prioritized action plan using only the retained records. Include rationale, tradeoffs, owners by role, validation steps, and items that need manager approval.' },
];
const savedRows = (response: any, key: string): any[] => {
  const value = response?.data?.[key] ?? response?.data;
  return Array.isArray(value) ? value : [];
};

function RequestControls({ request, generate, disabled = false }: { request: AIRequest; generate: () => void; disabled?: boolean }) {
  return <div className="space-y-2"><div className="flex gap-2">
    <button onClick={generate} disabled={disabled || request.loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">{request.loading ? 'Generating…' : 'Generate with OpenRouter'}</button>
    {request.loading && <button onClick={request.cancel} className="px-4 py-2 border rounded-md text-sm">Cancel request</button>}
  </div>{request.error && <p role="alert" className="text-sm text-red-700">{request.error}</p>}{request.status && <p role="status" className="text-sm text-gray-600">{request.status}</p>}</div>;
}

function FocusFields({ focus, setFocus, request, fill }: { focus: string; setFocus: (value: string) => void; request: AIRequest; fill?: () => void }) {
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2" aria-label="Fill every AI field">
      {reviewExamples.map(example => <button key={example.label} disabled={request.loading} onClick={() => { setFocus(example.focus); fill?.(); request.clear(); }} className="px-3 py-2 border rounded-md text-sm disabled:opacity-50">Fill all · {example.label}</button>)}
    </div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Review focus <span className="font-normal text-gray-500">(optional)</span></span><textarea value={focus} onChange={event => setFocus(event.target.value)} disabled={request.loading} maxLength={2000} rows={3} className={fieldClass} /></label>
    <p className="text-xs text-gray-500">Examples fill editable fields without running AI. Saved product and sale references remain real; these reports do not authorize purchases, price changes, or investigations.</p>
  </div>;
}

const AIStudio: React.FC = () => {
  const [tab, setTab] = useState<Tab>('copilot'), [draft, setDraft] = useState<any>({});
  const edit = (item: any) => { if (item.feature in toolLabels && item.feature !== 'history') { setDraft({ ...item.input, draftId: `${item.id}-${Date.now()}` }); setTab(item.feature as Tab); } };
  return <div className="space-y-4">
    <header className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">AI Studio</h1><p className="text-xs text-gray-500">Authenticated OpenRouter reports · 20 generations/hour</p></header>
    <nav className="flex flex-wrap gap-2 border-b border-gray-200" aria-label="AI tools">{(Object.keys(toolLabels) as Tab[]).map(value => <button key={value} onClick={() => { setDraft({}); setTab(value); }} aria-current={tab === value ? 'page' : undefined} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{toolLabels[value]}</button>)}</nav>
    {tab === 'copilot' && <CopilotPanel key={draft.draftId} initial={draft} />}{tab === 'reorder' && <ReorderPanel key={draft.draftId} initial={draft} />}{tab === 'elasticity' && <ElasticityPanel key={draft.draftId} initial={draft} />}{tab === 'fraud' && <FraudPanel key={draft.draftId} initial={draft} />}{(['insights', 'inventory', 'customers'] as Tab[]).includes(tab) && <AnalyticsPanel key={`${tab}-${draft.draftId}`} feature={tab as 'insights' | 'inventory' | 'customers'} initial={draft} />}{tab === 'operations-review' && <OperationsPanel key={draft.draftId} initial={draft} />}{tab === 'upsell' && <Upsell key={draft.draftId} initial={draft} />}{tab === 'history' && <HistoryPanel onEdit={edit} />}
  </div>;
};

function CopilotPanel({ initial = {} }: { initial?: any }) {
  const [message, setMessage] = useState<string>(initial.message || ''), [context, setContext] = useState<string>(initial.context || '');
  const request = useNativeAIRequest<any>();
  return <section className="bg-white p-6 rounded-lg shadow space-y-4">
    <h2 className="font-semibold">POS command review</h2><p className="text-sm text-gray-600">Draft a POS command for review. AI suggestions are displayed here; this screen does not execute a checkout command.</p>
    <div className="flex flex-wrap gap-2" aria-label="Fill every AI field">{reviewExamples.map(example => <button key={example.label} disabled={request.loading} onClick={() => { setMessage(`${example.focus} Explain how a cashier should review a proposed cart discount, without inventing product IDs or executing a sale.`); setContext('Example scenario: a cashier requests guidance before changing a cart. Exact products, quantities, customer eligibility, and authorization have not been supplied. Mark these as unknown and require validation.'); request.clear(); }} className="px-3 py-2 border rounded-md text-sm disabled:opacity-50">Fill all · {example.label}</button>)}</div>
    <label className="block space-y-1 text-sm"><span className="font-medium">Command or question</span><textarea value={message} onChange={event => setMessage(event.target.value)} disabled={request.loading} rows={4} className={fieldClass} /></label>
    <label className="block space-y-1 text-sm"><span className="font-medium">Supporting context <span className="font-normal text-gray-500">(optional)</span></span><textarea value={context} onChange={event => setContext(event.target.value)} disabled={request.loading} rows={3} className={fieldClass} /></label>
    <RequestControls request={request} disabled={!message.trim()} generate={() => void request.run(async signal => (await apiService.request('/ai/copilot', { method: 'POST', body: JSON.stringify({ message, context }), signal })).data)} />
    {request.result && <AIResponseReport value={request.result} title="POS command review" />}
  </section>;
}

function ReorderPanel({ initial = {} }: { initial?: any }) {
  const [reviewFocus, setFocus] = useState<string>(initial.reviewFocus || '');
  const request = useNativeAIRequest<any>();
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">Reorder recommendation</h2><p className="text-sm text-gray-600">Review saved 30-day sales velocity and current inventory. Any recommendation remains a draft for purchasing review.</p>
    <FocusFields focus={reviewFocus} setFocus={setFocus} request={request} />
    <RequestControls request={request} generate={() => void request.run(async signal => (await apiService.request('/ai/reorder', { method: 'POST', body: JSON.stringify({ reviewFocus }), signal })).data)} />
    {request.result?.plan && <AIResponseReport value={request.result.plan} title="Reorder recommendation" />}
  </section>;
}

function ElasticityPanel({ initial = {} }: { initial?: any }) {
  const [productId, setProductId] = useState<string>(initial.productId || ''), [products, setProducts] = useState<any[]>([]), [reviewFocus, setFocus] = useState<string>(initial.reviewFocus || ''), [referenceError, setReferenceError] = useState('');
  const request = useNativeAIRequest<any>();
  useEffect(() => { let active = true; apiService.getProducts({ limit: 100 }).then(response => { if (active) setProducts(savedRows(response, 'products')); }).catch(error => { if (active) setReferenceError(error.message || 'Could not load saved products.'); }); return () => { active = false; }; }, []);
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">Price elasticity review</h2><p className="text-sm text-gray-600">Estimate a selected saved product’s price elasticity from historical sales. A manager must validate any proposed price change.</p>
    <FocusFields focus={reviewFocus} setFocus={setFocus} request={request} fill={() => setProductId(value => products.some(product => product.id === value) ? value : products[0]?.id || '')} />
    <label className="block space-y-1 text-sm"><span className="font-medium">Saved product</span><select value={productId} onChange={event => { setProductId(event.target.value); request.clear(); }} disabled={request.loading} className={fieldClass}><option value="">Select a saved product…</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>
    {!products.length && <p role="status" className="text-sm text-gray-600">{referenceError || 'No saved products are available. Load or create a product through the existing Products workflow before generating.'}</p>}
    <RequestControls request={request} disabled={!products.some(product => product.id === productId)} generate={() => void request.run(async signal => (await apiService.request('/ai/elasticity', { method: 'POST', body: JSON.stringify({ productId, reviewFocus }), signal })).data)} />
    {request.result?.plan && <AIResponseReport value={request.result.plan} title="Price elasticity review" />}
  </section>;
}

function FraudPanel({ initial = {} }: { initial?: any }) {
  const [saleId, setSaleId] = useState<string>(initial.saleId || ''), [sales, setSales] = useState<any[]>([]), [reviewFocus, setFocus] = useState<string>(initial.reviewFocus || ''), [referenceError, setReferenceError] = useState('');
  const request = useNativeAIRequest<any>();
  useEffect(() => { let active = true; apiService.getSales({ limit: 100 }).then(response => { if (active) setSales(savedRows(response, 'sales')); }).catch(error => { if (active) setReferenceError(error.message || 'Could not load saved sales.'); }); return () => { active = false; }; }, []);
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">Sale risk review</h2><p className="text-sm text-gray-600">Review a saved sale’s discount, refund, and cashier signals. A model score is a review aid, not a finding of misconduct.</p>
    <FocusFields focus={reviewFocus} setFocus={setFocus} request={request} fill={() => setSaleId(value => sales.some(sale => sale.id === value) ? value : sales[0]?.id || '')} />
    <label className="block space-y-1 text-sm"><span className="font-medium">Saved sale</span><select value={saleId} onChange={event => { setSaleId(event.target.value); request.clear(); }} disabled={request.loading} className={fieldClass}><option value="">Select a saved sale…</option>{sales.map(sale => <option key={sale.id} value={sale.id}>{sale.saleNumber || sale.id} · {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'Saved sale'}</option>)}</select></label>
    {!sales.length && <p role="status" className="text-sm text-gray-600">{referenceError || 'No saved sales are available. Complete a sale through the existing POS workflow before generating.'}</p>}
    <RequestControls request={request} disabled={!sales.some(sale => sale.id === saleId)} generate={() => void request.run(async signal => (await apiService.request('/ai/fraud/score', { method: 'POST', body: JSON.stringify({ saleId, reviewFocus }), signal })).data)} />
    {request.result?.verdict && <AIResponseReport value={request.result.verdict} title="Sale risk review" />}
  </section>;
}

function AnalyticsPanel({ feature, initial = {} }: { feature: 'insights' | 'inventory' | 'customers'; initial?: any }) {
  const [reviewFocus, setFocus] = useState<string>(initial.reviewFocus || '');
  const request = useNativeAIRequest<any>();
  const descriptions = { insights: 'Review the native 30-day sales aggregates, product performance and payment patterns. Staffing or pricing changes require manager review.', inventory: 'Review actual saved stock and sales velocity. Recommendations remain draft purchasing guidance.', customers: 'Review saved purchase cohorts and customer retention signals. This report does not send messages or change loyalty balances.' };
  const output = request.result?.[feature === 'insights' ? 'insights' : feature === 'inventory' ? 'recommendations' : 'aiInsights'];
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">{toolLabels[feature]}</h2><p className="text-sm text-gray-600">{descriptions[feature]}</p><FocusFields focus={reviewFocus} setFocus={setFocus} request={request} /><RequestControls request={request} generate={() => void request.run(async signal => (await apiService.request(`/ai/${feature}`, { method: 'POST', body: JSON.stringify({ reviewFocus }), signal })).data)} />{output && <><p className="text-xs text-gray-500">Saved report: {request.result.insightId} · {request.result.generatedAt ? new Date(request.result.generatedAt).toLocaleString() : 'Saved'}</p><AIResponseReport value={output} title={toolLabels[feature]} /></>}</section>;
}

function OperationsPanel({ initial = {} }: { initial?: any }) {
  const [prompt, setPrompt] = useState<string>(initial.prompt || '');
  const request = useNativeAIRequest<any>();
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">Operations review</h2><p className="text-sm text-gray-600">Review a deidentified operating brief for reconciliation risks and control gaps. No financial action or transaction change is authorized by this report.</p><div className="flex flex-wrap gap-2" aria-label="Fill every AI field">{reviewExamples.map(example => <button key={example.label} disabled={request.loading} onClick={() => { setPrompt(`${example.focus} Example review scope: cashier handover, drawer reconciliation and refund approval checks. Actual transaction totals, discrepancies and supporting receipts are not supplied. State these gaps and propose human validation steps without inventing amounts.`); request.clear(); }} className="px-3 py-2 border rounded-md text-sm disabled:opacity-50">Fill all · {example.label}</button>)}</div><label className="block space-y-1 text-sm"><span className="font-medium">Deidentified operating brief</span><textarea value={prompt} onChange={event => setPrompt(event.target.value)} disabled={request.loading} maxLength={4000} rows={5} className={fieldClass}/></label><RequestControls request={request} disabled={!prompt.trim()} generate={() => void request.run(signal => apiService.request('/ai/operations-review', { method: 'POST', body: JSON.stringify({ prompt }), signal }))}/>{request.result && <><p className="text-xs text-gray-500">Saved report: {request.result.interactionId} · Provider receipt: {request.result.providerReceipt?.requestId}</p><AIResponseReport value={request.result.content} title="Operations review"/></>}</section>;
}

function HistoryPanel({ onEdit }: { onEdit: (item: any) => void }) {
  const [items, setItems] = useState<any[]>([]), [page, setPage] = useState(1), [feature, setFeature] = useState(''), [selected, setSelected] = useState<any>(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setError(''); setItems([]);
    async function load() {
      const generic = async () => { const query = new URLSearchParams({ page: '1', pageSize: '100' }); if (feature) query.set('feature', feature); return savedRows(await apiService.request(`/ai/results?${query}`, { signal: controller.signal }), 'items'); };
      const analytics = async (kind: string) => savedRows(await apiService.request(`/ai/${kind}?limit=20`, { signal: controller.signal }), 'items').map(row => ({ ...row, feature: kind, status: 'success', output: row.insights ?? row.recommendations ?? row.output, createdAt: row.generatedAt }));
      const operations = async () => savedRows(await apiService.request('/ai/operations-review', { signal: controller.signal }), 'items').map(row => ({ ...row, feature: 'operations-review', status: 'success' }));
      const rows = feature === 'operations-review' ? await operations() : ['insights', 'inventory', 'customers', 'upsell'].includes(feature) ? await analytics(feature) : feature ? await generic() : (await Promise.all([generic(), ...['insights', 'inventory', 'customers', 'upsell'].map(analytics), operations()])).flat();
      if (!controller.signal.aborted) setItems(rows.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)));
    }
    // Defer the request until the effect survives React's development remount.
    // Otherwise six history requests are counted twice against the per-user limit.
    const pending = window.setTimeout(() => { void load().catch(cause => { if (!controller.signal.aborted) setError(cause.message || 'Could not load report history.'); }); }, 25);
    return () => { window.clearTimeout(pending); controller.abort(); };
  }, [feature]);
  useEffect(() => { if (!selected) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [selected]);
  const totalPages = Math.max(1, Math.ceil(items.length / 20));
  return <section className="bg-white p-6 rounded-lg shadow space-y-4"><h2 className="font-semibold">Your saved AI reports</h2><p className="text-xs text-gray-500">Recent owned receipts: up to 100 workflow reports, 20 per analytics or Upsell tool and 50 operations reviews. Provider evidence is retained.</p><label className="block text-sm">Feature<select value={feature} onChange={event => { setFeature(event.target.value); setPage(1); }} className={fieldClass}><option value="">Recent reports across tools</option>{(Object.keys(toolLabels) as Tab[]).filter(value => value !== 'history').map(value => <option key={value} value={value}>{toolLabels[value]}</option>)}</select></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <table className="min-w-full text-sm"><thead><tr className="bg-gray-50"><th className="p-2 text-left">When</th><th className="p-2 text-left">Feature</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Report</th></tr></thead><tbody>{items.slice((page - 1) * 20, page * 20).map(item => <tr key={`${item.feature}-${item.id}`} className="border-t cursor-pointer" onClick={() => setSelected(item)}><td className="p-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Saved receipt'}</td><td className="p-2">{toolLabels[item.feature as Tab] || item.feature}</td><td className="p-2">{item.status}</td><td className="p-2"><button onClick={event => { event.stopPropagation(); setSelected(item); }} className="text-blue-700 underline">Open report</button></td></tr>)}</tbody></table>
    {!items.length && !error && <p className="text-sm text-gray-500">No saved reports match this filter.</p>}
    <div className="flex items-center justify-between"><button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button><span className="text-xs text-gray-500">Page {page} / {totalPages}</span><button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button></div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-label="Saved AI report" className="w-full max-w-4xl max-h-[85vh] overflow-auto bg-white rounded-xl p-6 space-y-4" onClick={event => event.stopPropagation()}><h3 className="font-semibold">{toolLabels[selected.feature as Tab] || selected.feature} report</h3><p className="text-xs text-gray-500">Saved report: {selected.id} · {selected.model || selected.providerReceipt?.upstreamModel || 'Model retained by the native provider workflow'}</p>{selected.status === 'success' ? <AIResponseReport value={selected.output}/> : <p role="alert" className="text-red-700">{selected.errorMessage || 'This request did not produce an AI report.'}</p>}<div className="flex gap-2"><button disabled={!selected.input || !(selected.feature in toolLabels) || (selected.feature === 'upsell' && !Array.isArray(selected.input.items))} title={selected.feature === 'upsell' && !Array.isArray(selected.input?.items) ? 'The original cart references were not retained. Prepare a new cart in Upsell.' : undefined} onClick={() => onEdit(selected)} className="px-3 py-2 border rounded-md text-sm">Edit</button><button disabled title="Provider evidence is retained; no native deletion contract is available" className="px-3 py-2 border rounded-md text-sm opacity-50">Delete</button><button onClick={() => setSelected(null)} className="px-3 py-2 border rounded-md text-sm">Cancel</button></div><p className="text-xs text-gray-500">Edit prepares the saved input for a new request. The original receipt remains retained.</p></div></div>}
  </section>;
}

export default AIStudio;

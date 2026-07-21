import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { enqueueOfflineCheckout, pendingOfflineCheckouts, removeOfflineCheckout, type OfflineCheckoutEnvelope } from '../services/offlineCheckoutQueue';

type CatalogProduct = { id: string; name: string; sku: string; barcode?: string; categoryId?: string; unitPriceCents: number; availableMilliunits: number };
type TaxRule = { id: string; rateBps: number; appliesTo: string; referenceId?: string; priority: number; compound: boolean };
type Catalog = { location: { id: string; code: string; currency: string; fiscalMode: string }; taxProfile: { version: number; jurisdictionCode: string; isCertified: boolean; rules: TaxRule[] }; products: CatalogProduct[] };
type CartItem = CatalogProduct & { quantityMilliunits: number };
type TenderMode = 'CASH' | 'CARD_PRESENT' | 'GIFT_CARD' | 'SPLIT_CASH_CARD';

const roundHalfUp = (numerator: number, denominator: number) => Math.floor((numerator + Math.floor(denominator / 2)) / denominator);

function lineTotal(item: CartItem, rules: TaxRule[]) {
  const subtotalCents = roundHalfUp(item.quantityMilliunits * item.unitPriceCents, 1000);
  let taxCents = 0;
  for (const rule of [...rules].sort((a, b) => a.priority - b.priority)) {
    if (rule.appliesTo !== 'ALL' && !(rule.appliesTo === 'PRODUCT' && rule.referenceId === item.id) && !(rule.appliesTo === 'CATEGORY' && rule.referenceId === item.categoryId)) continue;
    taxCents += roundHalfUp((rule.compound ? subtotalCents + taxCents : subtotalCents) * rule.rateBps, 10_000);
  }
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

const POS: React.FC = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [cashReceived, setCashReceived] = useState(false);
  const [tenderMode, setTenderMode] = useState<TenderMode>('CASH');
  const [splitCashCents, setSplitCashCents] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [pendingCheckoutId, setPendingCheckoutId] = useState('');
  const locationId = localStorage.getItem('posLocationId') ?? '';
  const shiftId = localStorage.getItem('posShiftId') ?? '';
  const workstationDeviceId = localStorage.getItem('posWorkstationDeviceId') ?? '';
  const readerDeviceId = localStorage.getItem('posReaderDeviceId') ?? '';
  const token = localStorage.getItem('accessToken') ?? '';

  const loadCatalog = useCallback(async () => {
    if (!locationId || !token) return;
    const response = await fetch(`/api/v1/operations/locations/${locationId}/catalog`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? 'Catalog unavailable');
    setCatalog(body.data);
  }, [locationId, token]);

  useEffect(() => { loadCatalog().catch((error) => setMessage(error.message)); }, [loadCatalog]);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener('online', changed); window.addEventListener('offline', changed);
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed); };
  }, []);

  const totals = useMemo(() => cart.reduce((sum, item) => {
    const line = lineTotal(item, catalog?.taxProfile.rules ?? []);
    return { subtotalCents: sum.subtotalCents + line.subtotalCents, taxCents: sum.taxCents + line.taxCents, totalCents: sum.totalCents + line.totalCents };
  }, { subtotalCents: 0, taxCents: 0, totalCents: 0 }), [cart, catalog]);

  const add = (product: CatalogProduct) => setCart((current) => {
    const existing = current.find((item) => item.id === product.id);
    if (existing) return current.map((item) => item.id === product.id ? { ...item, quantityMilliunits: Math.min(item.availableMilliunits, item.quantityMilliunits + 1000) } : item);
    return [...current, { ...product, quantityMilliunits: 1000 }];
  });

  const submitBarcode = (event: React.FormEvent) => {
    event.preventDefault();
    const product = catalog?.products.find((item) => item.barcode === barcode.trim() || item.sku === barcode.trim());
    if (!product) setMessage('Barcode/SKU not found in the current location catalog.'); else add(product);
    setBarcode('');
  };

  const nextOfflineSequence = () => {
    const key = `posOfflineSequence:${workstationDeviceId}`;
    const next = Number(localStorage.getItem(key) ?? '0') + 1;
    localStorage.setItem(key, String(next));
    return next;
  };

  const envelope = (source: 'ONLINE' | 'OFFLINE') => {
    if (!catalog || !locationId || !shiftId || !workstationDeviceId) throw new Error('Location, shift, and workstation must be configured before checkout.');
    const idempotencyKey = crypto.randomUUID();
    const tenders = source === 'OFFLINE' || tenderMode === 'CASH'
      ? [{ method: 'CASH' as const, amountCents: totals.totalCents }]
      : tenderMode === 'CARD_PRESENT'
        ? [{ method: 'CARD_PRESENT' as const, amountCents: totals.totalCents, readerDeviceId }]
        : tenderMode === 'GIFT_CARD'
          ? [{ method: 'GIFT_CARD' as const, amountCents: totals.totalCents, giftCardCode: giftCardCode.trim() }]
          : [{ method: 'CASH' as const, amountCents: splitCashCents }, { method: 'CARD_PRESENT' as const, amountCents: totals.totalCents - splitCashCents, readerDeviceId }];
    return {
      locationId, shiftId, workstationDeviceId, idempotencyKey, source,
      ...(source === 'OFFLINE' ? { offlineSequence: nextOfflineSequence(), capturedAt: new Date().toISOString(), expectedTotalCents: totals.totalCents, expectedTaxProfileVersion: catalog.taxProfile.version } : {}),
      items: cart.map((item) => ({ productId: item.id, quantityMilliunits: item.quantityMilliunits })),
      tenders,
    };
  };

  const onlineCheckout = async () => {
    setBusy(true); setMessage('');
    try {
      if ((tenderMode === 'CARD_PRESENT' || tenderMode === 'SPLIT_CASH_CARD') && !readerDeviceId) throw new Error('Configure an enrolled reader before card-present checkout.');
      if (tenderMode === 'SPLIT_CASH_CARD' && (!Number.isInteger(splitCashCents) || splitCashCents <= 0 || splitCashCents >= totals.totalCents)) throw new Error('Split cash must be positive whole cents and less than the total.');
      if (tenderMode === 'GIFT_CARD' && !giftCardCode.trim()) throw new Error('Enter the gift-card code.');
      const response = await fetch('/api/v1/operations/checkouts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(envelope('ONLINE')) });
      const body = await response.json();
      if (!response.ok) throw new Error(`${body.code ?? 'CHECKOUT_FAILED'}: ${body.message ?? 'Checkout failed'}`);
      if (body.data.checkout.status === 'COMPLETED') {
        setCart([]); setGiftCardCode(''); setSplitCashCents(0); setPendingCheckoutId(''); setMessage(`Completed ${body.data.checkout.receiptNumber}; receipt and drawer jobs are queued.`); await loadCatalog();
      } else {
        setPendingCheckoutId(body.data.checkout.id); setMessage('Reader payment is in progress. Ask the customer to present a card, then verify the provider result. Do not start another checkout.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Checkout failed'); } finally { setBusy(false); }
  };

  const verifyCardPayment = async () => {
    if (!pendingCheckoutId) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/operations/checkouts/${pendingCheckoutId}/retry-payment`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{}' });
      const body = await response.json();
      if (!response.ok) throw new Error(`${body.code ?? 'PAYMENT_RECOVERY_FAILED'}: ${body.message ?? 'Payment recovery failed'}`);
      if (body.data.checkout.status === 'COMPLETED') {
        setCart([]); setSplitCashCents(0); setPendingCheckoutId(''); setMessage(`Completed ${body.data.checkout.receiptNumber}; tokenized card result and receipt are durable.`); await loadCatalog();
      } else setMessage('The provider has not completed payment. Follow the reader prompt and verify again; do not create a second checkout.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Payment recovery failed'); } finally { setBusy(false); }
  };

  const offlineCheckout = async () => {
    if (!cashReceived) return setMessage('Confirm that cash was physically received before recording an offline sale.');
    setBusy(true); setMessage('');
    try {
      const value = envelope('OFFLINE') as OfflineCheckoutEnvelope;
      await enqueueOfflineCheckout(value);
      setCart([]); setCashReceived(false); setMessage(`Encrypted offline cash sale queued as ${value.idempotencyKey}. Card and gift-card tender are unavailable offline.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Offline capture failed'); } finally { setBusy(false); }
  };

  const syncOffline = async () => {
    if (!online || !workstationDeviceId) return;
    setBusy(true); setMessage('');
    try {
      const queued = await pendingOfflineCheckouts(workstationDeviceId);
      let synced = 0;
      for (const value of queued) {
        const response = await fetch('/api/v1/operations/checkouts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(value) });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(`${body.code ?? 'OFFLINE_SYNC_BLOCKED'}: ${body.message ?? 'Manager review required'}`);
        }
        await removeOfflineCheckout(value.idempotencyKey); synced += 1;
      }
      setMessage(`${synced} offline sale(s) synchronized idempotently.`); await loadCatalog();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Offline synchronization failed'); } finally { setBusy(false); }
  };

  if (!locationId || !shiftId || !workstationDeviceId) return <div className="rounded-lg bg-amber-50 p-6 text-amber-900"><h1 className="text-xl font-semibold">Store operations setup required</h1><p>Set the provisioned location, open shift, and enrolled workstation identifiers before using checkout. The legacy client-priced checkout is disabled.</p></div>;

  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <section className="rounded-lg bg-white p-6 shadow lg:col-span-2">
      <div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-semibold">Controlled checkout</h1><p className="text-sm text-gray-500">{catalog?.taxProfile.jurisdictionCode} · tax profile v{catalog?.taxProfile.version} · {catalog?.location.fiscalMode}</p></div><span className={`rounded px-2 py-1 text-sm ${online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{online ? 'Online' : 'Offline cash-only'}</span></div>
      <form onSubmit={submitBarcode} className="mb-4 flex"><input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan barcode or SKU" className="flex-1 rounded-l border px-3 py-2"/><button className="rounded-r bg-blue-600 px-4 text-white">Add</button></form>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{catalog?.products.map((product) => <button key={product.id} onClick={() => add(product)} disabled={product.availableMilliunits < 1000} className="rounded border p-3 text-left disabled:opacity-40"><div className="font-medium">{product.name}</div><div className="text-sm text-gray-500">{product.sku}</div><div className="font-semibold text-blue-700">${(product.unitPriceCents / 100).toFixed(2)}</div><div className="text-xs">Available {(product.availableMilliunits / 1000).toFixed(3)}</div></button>)}</div>
    </section>
    <section className="rounded-lg bg-white p-6 shadow"><h2 className="mb-4 text-lg font-semibold">Cart</h2><div className="space-y-3">{cart.map((item) => <div key={item.id} className="rounded bg-gray-50 p-3"><div className="flex justify-between"><span>{item.name}</span><button onClick={() => setCart((current) => current.filter((row) => row.id !== item.id))}><TrashIcon className="h-4 w-4 text-red-500"/></button></div><div className="mt-2 flex items-center gap-3"><button onClick={() => setCart((current) => current.map((row) => row.id === item.id ? { ...row, quantityMilliunits: Math.max(1000, row.quantityMilliunits - 1000) } : row))}><MinusIcon className="h-4 w-4"/></button><span>{(item.quantityMilliunits / 1000).toFixed(3)}</span><button onClick={() => add(item)}><PlusIcon className="h-4 w-4"/></button><span className="ml-auto">${(lineTotal(item, catalog?.taxProfile.rules ?? []).totalCents / 100).toFixed(2)}</span></div></div>)}</div>
      <div className="mt-4 border-t pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>${(totals.subtotalCents / 100).toFixed(2)}</span></div><div className="flex justify-between"><span>Tax</span><span>${(totals.taxCents / 100).toFixed(2)}</span></div><div className="mt-2 flex justify-between text-lg font-semibold"><span>Total</span><span>${(totals.totalCents / 100).toFixed(2)}</span></div></div>
      {online ? <><label className="mt-5 block text-sm font-medium">Tender<select value={tenderMode} disabled={Boolean(pendingCheckoutId)} onChange={(event) => setTenderMode(event.target.value as TenderMode)} className="mt-1 w-full rounded border px-3 py-2"><option value="CASH">Cash</option><option value="CARD_PRESENT">Card present</option><option value="GIFT_CARD">Gift card</option><option value="SPLIT_CASH_CARD">Split cash + card</option></select></label>{tenderMode === 'SPLIT_CASH_CARD' && <label className="mt-2 block text-sm">Cash amount (cents)<input type="number" min="1" step="1" value={splitCashCents} onChange={(event) => setSplitCashCents(Number(event.target.value))} className="mt-1 w-full rounded border px-3 py-2"/></label>}{tenderMode === 'GIFT_CARD' && <label className="mt-2 block text-sm">Gift-card code<input value={giftCardCode} onChange={(event) => setGiftCardCode(event.target.value)} autoComplete="off" className="mt-1 w-full rounded border px-3 py-2"/></label>}<button disabled={!cart.length || busy || Boolean(pendingCheckoutId)} onClick={onlineCheckout} className="mt-3 w-full rounded bg-green-600 py-3 font-medium text-white disabled:bg-gray-300">Start controlled checkout</button>{pendingCheckoutId && <button disabled={busy} onClick={verifyCardPayment} className="mt-2 w-full rounded bg-blue-700 py-3 font-medium text-white disabled:bg-gray-300">Verify reader payment</button>}</> : <><label className="mt-5 flex gap-2 text-sm"><input type="checkbox" checked={cashReceived} onChange={(event) => setCashReceived(event.target.checked)}/>Cash has been physically received</label><button disabled={!cart.length || busy} onClick={offlineCheckout} className="mt-2 w-full rounded bg-amber-600 py-3 font-medium text-white disabled:bg-gray-300">Record encrypted offline cash sale</button></>}
      {online && <button disabled={busy} onClick={syncOffline} className="mt-2 w-full rounded border border-blue-600 py-2 text-blue-700">Synchronize offline queue</button>}
      {message && <p className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    </section>
  </div>;
};

export default POS;

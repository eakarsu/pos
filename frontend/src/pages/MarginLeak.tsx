import React, { useState } from 'react';

const sample = JSON.stringify([
  { sku: 'LATTE', price: 5.5, cost: 2.1, discount: 0.5, wasteRisk: 8 },
  { sku: 'MUFFIN', price: 4, cost: 1.6, discount: 1.25, wasteRisk: 18 }
], null, 2);

export default function MarginLeak() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState<any>(null);

  async function run() {
    const response = await fetch('/api/v1/margin-leak/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basket: JSON.parse(payload) }),
    });
    setResult(await response.json());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Margin Leak Register</h1>
        <p className="text-gray-600">Find discount, waste, and COGS pressure inside active POS baskets.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow">
          <textarea className="h-64 w-full rounded-md border p-3 font-mono text-sm" value={payload} onChange={(event) => setPayload(event.target.value)} />
          <button className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-white" onClick={run}>Scan margins</button>
        </section>
        <section className="rounded-lg bg-white p-5 shadow">
          {result ? result.findings.map((row: any) => (
            <div key={row.sku} className="border-b py-3">
              <strong>{row.sku}</strong>
              <div>{row.margin}% margin | risk {row.risk}/100</div>
              <p className="text-sm text-gray-600">{row.action}</p>
            </div>
          )) : <p className="text-gray-600">Run a scan to see leakage by SKU.</p>}
        </section>
      </div>
    </div>
  );
}

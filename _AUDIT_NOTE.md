# Audit Note — pos

**Date**: 2026-05-06
**Bucket**: A. DETECTOR_FALSE_POSITIVE (also a junk-name)

## Summary

The audit (`_AUDIT/reports/batch_11.md` → "pos" entry) classified this as
`partial-build — foundational POS components … but no visible API routes or
AI integration`. The TSV counters reported 0 routes / 0 AI endpoints. That
is stale — the project already exposes both a non-AI route surface and a
multi-endpoint AI surface.

## Files containing LLM references

- `src/services/aiService.ts` — shared AI service (OpenRouter/Anthropic).
- `src/routes/ai/copilot.ts` — conversational POS copilot.
- `src/routes/ai/elasticity.ts` — price-elasticity / dynamic-pricing.
- `src/routes/ai/reorder.ts` — automated reorder/demand-forecast suggestions.
- `src/routes/ai/fraud.ts` — transaction fraud detection.
- `frontend/src/pages/AIStudio.tsx` — frontend AI Studio page.
- (`src/routes/ai/index.ts`, `src/routes/ai/customers.ts`,
  `src/routes/ai/insights.ts`, `src/routes/ai/inventory.ts`,
  `src/routes/ai/results.ts` — sibling AI endpoints.)

Non-AI route surface present in `src/routes/`: `auth.ts`, `categories.ts`,
`contact.ts`, `customers.ts`, `dashboard.ts`, `index.ts`, `inventory.ts`,
`products.ts`, `reports.ts`, `sales.ts`, `settings.ts`, `system.ts`.

## Disposition

- **Detector false positive.** Substantial AI + non-AI route surface already
  exists in TypeScript.
- Project name `pos` is a junk/generic name per the workflow.

## Audit recommendations applied this batch

Batch_11 §pos lists these "Custom Feature Suggestions":
1. AI-Driven Upsell Recommendations — **implemented this batch (see below)**.
2. Demand Forecasting — already implemented (`/ai/reorder`).
3. Dynamic Pricing — already implemented (`/ai/elasticity`).
4. Customer Loyalty Automation — schema already has `loyaltyPoints`; needs
   product-decision on rules.
5. Multi-Location Inventory Sync — needs new `Location` schema.
6. Receipt printing / payment terminal / tax calculation — NEEDS-CREDS.

### MECHANICAL items implemented

1. **Checkout-time upsell endpoint** —
   `src/routes/ai/upsell.ts`, mounted at `/api/v1/ai/upsell` via
   `src/routes/ai/index.ts`.
   - Body: `{ items: [{productId, qty?}], customerId? }`.
   - Pulls cart products, calculates 90-day co-purchase frequency among
     completed sales, sends top candidates to LLM with explicit JSON schema
     for `recommendations[]` (productId, name, price, rationale, cashier
     script). Returns AI suggestion or graceful frequency-based fallback if
     the LLM fails.
   - Includes optional customer context (totalSpent, loyaltyPoints,
     lastPurchase) when `customerId` is provided.
   - Persists each call to `aiInsight` (type=`upsell`) for telemetry.
   - Pattern matches sibling routers (Express + Prisma + `callAI` +
     `parseAIJson`) for stylistic consistency.

## Backlog (deferred, prioritised)

1. **Customer loyalty automation** — schema has `loyaltyPoints` but no
   rules engine; add `loyalty.rules` config + a `loyalty/award` route to
   compute points on sale completion. NEEDS-PRODUCT-DECISION on accrual
   rate, redemption thresholds, tier definitions.
2. **Multi-location inventory sync** — needs `Location` schema and
   per-location stock; cross-cutting refactor. NEEDS-PRODUCT-DECISION.
3. **Receipt printing / payment terminal / tax calculation** —
   external integrations explicitly forbidden by the apply workflow.
   NEEDS-CREDS for Stripe/Square/etc.
4. **Rename to a real-product name** — `pos` is a junk/generic name; the
   workflow flags it for renaming. Out of scope for this batch.
5. **Promote AI endpoints into the audit TSV** — so future batches don't
   re-flag this project. Detector-side fix, not a code change here.

## Files touched this batch

- `src/routes/ai/upsell.ts` — new endpoint.
- `src/routes/ai/index.ts` — wired the new router.

## Apply pass 3 (frontend)

Frontend already calls the apply-pass-2 upsell endpoint:

- `frontend/src/pages/Upsell.tsx` posts to `/ai/upsell` via
  `apiService.request` (which attaches the JWT bearer from `localStorage`
  and surfaces backend errors, including the 503-no-key path).
- `frontend/src/App.tsx` registers `<Route path="ai/upsell" element={<Upsell />} />`.

The other AI surfaces (`copilot`, `elasticity`, `reorder`, `fraud`,
`customers`, `insights`, `inventory`, `results`) are reachable from
`AIStudio.tsx` and the AI Studio nav. No FE changes required.

Action: **LEFT-AS-IS**.

## Apply pass 4 (mechanical backlog)

No mechanical items remain. The backlog (loyalty automation,
multi-location inventory, receipt/payment/tax integrations, project
rename, detector-side TSV refresh) is entirely
NEEDS-PRODUCT-DECISION / NEEDS-CREDS / detector-side. No changes this
pass.

Action: **LEFT-AS-IS**.

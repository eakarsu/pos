// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapDemandForecastingPage() {
  return (
    <GapFeaturePage
      title="Demand Forecasting"
      description="Demand Forecasting"
      slug="demand-forecasting"
      aiResultKey="forecast"
      fields={[
  {
    "name": "sku",
    "label": "SKU",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "history",
    "label": "Sales History (JSON)",
    "type": "json"
  }
]}
    />
  )
}

// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapTaxJurisdictionsPage() {
  return (
    <GapFeaturePage
      title="Tax Jurisdiction Engine"
      description="Tax Jurisdiction Engine"
      slug="tax-jurisdictions"
      aiResultKey="taxCalc"
      fields={[
  {
    "name": "jurisdiction",
    "label": "Jurisdiction",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "subtotal",
    "label": "Subtotal",
    "type": "number"
  }
]}
    />
  )
}

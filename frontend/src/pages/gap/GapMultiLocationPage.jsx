// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapMultiLocationPage() {
  return (
    <GapFeaturePage
      title="Multi-Location Support"
      description="Multi-Location Support"
      slug="multi-location"
      aiResultKey="location"
      fields={[
  {
    "name": "locationId",
    "label": "Location ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "name",
    "label": "Name",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}

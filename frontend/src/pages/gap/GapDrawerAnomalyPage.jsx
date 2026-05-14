// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapDrawerAnomalyPage() {
  return (
    <GapFeaturePage
      title="Cash Drawer Anomaly Detection"
      description="Cash Drawer Anomaly Detection"
      slug="drawer-anomaly"
      aiResultKey="flags"
      fields={[
  {
    "name": "drawerActivity",
    "label": "Drawer Activity (JSON)",
    "type": "json"
  }
]}
    />
  )
}

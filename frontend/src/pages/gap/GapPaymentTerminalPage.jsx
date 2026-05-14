// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapPaymentTerminalPage() {
  return (
    <GapFeaturePage
      title="Payment Terminal Integration"
      description="Payment Terminal Integration"
      slug="payment-terminal"
      aiResultKey="terminal"
      fields={[
  {
    "name": "terminalId",
    "label": "Terminal ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "provider",
    "label": "Provider",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}

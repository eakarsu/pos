# Hardware agent contract

Workstations and readers are enrolled per location. The one-time credential is HMAC-verified and sent only as `X-Device-ID` plus `X-Device-Credential` over TLS. Heartbeats may reduce, but never expand, enrolled capabilities.

Supported workstation capabilities are `OFFLINE_QUEUE`, `BARCODE_SCANNER`, `RECEIPT_PRINTER`, and `CASH_DRAWER`; readers use `CARD_PRESENT`. Barcode resolution is location scoped. Receipt and drawer commands are durable `HardwareJob` records with unique dedupe keys.

An agent claims one due job. Claims expire after 60 seconds; retryable failures use exponential backoff and stop after five attempts. A repeated success acknowledgment is harmless. Agents must persist the job ID before acting, acknowledge only after the device reports success, never print/open twice for the same job ID, and return bounded error codes plus an operator-safe message. Device SDK/driver compatibility, firmware, paper-out/cutter/drawer sensors, USB/network recovery, and electromagnetic/safety certification require acceptance on the selected physical models.

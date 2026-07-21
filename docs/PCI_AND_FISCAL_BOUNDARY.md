# PCI, tax, and fiscal boundary

The application requests card-present operations from the configured provider and retains only provider references, generated token references, card brand, and last four digits. It deliberately has no fields or logs for PAN, magnetic-stripe/EMV track data, PIN, CVC/CVV, or Terminal client secrets. Card payments are prohibited offline. Provider metadata is allow-filtered against common sensitive-field names, but production logging and observability still require validation.

This design reduces exposure; it does not determine or certify PCI DSS scope. The merchant, acquirer, payment provider, and qualified assessor must document the final network, workstation/agent, browser, reader, user access, logging, incident response, vulnerability management, and applicable SAQ/reporting obligations. AI routes must not receive checkout, card, gift-card, or customer operational payloads.

Tax profiles are immutable versioned snapshots selected by captured time. Rules can target all goods, a product, or a category; exemptions require a location/customer/code, effective dates, and a stored SHA-256 certificate hash. Integer half-up line rounding is the only implemented rounding mode. `NON_FISCAL_SIMULATION` is the default and must remain visible until a named jurisdiction and receipt/fiscal-device workflow has attributable approval/certification evidence.

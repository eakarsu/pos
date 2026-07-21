-- Strengthen actor, location, and child-record integrity for operational evidence.
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "register_shifts" ADD CONSTRAINT "register_shifts_managerApprovedBy_fkey" FOREIGN KEY ("managerApprovedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_lines" ADD CONSTRAINT "refund_lines_checkoutLineId_fkey" FOREIGN KEY ("checkoutLineId") REFERENCES "operational_checkout_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_managerApprovedBy_fkey" FOREIGN KEY ("managerApprovedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounting_outbox" ADD CONSTRAINT "accounting_outbox_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION enforce_refund_line_scope() RETURNS trigger AS $$
DECLARE refund_checkout TEXT; line_checkout TEXT;
BEGIN
  SELECT "checkoutId" INTO refund_checkout FROM "refund_cases" WHERE "id" = NEW."refundId";
  SELECT "checkoutId" INTO line_checkout FROM "operational_checkout_lines" WHERE "id" = NEW."checkoutLineId";
  IF refund_checkout IS NULL OR line_checkout IS NULL OR refund_checkout <> line_checkout THEN
    RAISE EXCEPTION 'refund line checkout scope mismatch';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_lines_scope BEFORE INSERT ON "refund_lines" FOR EACH ROW EXECUTE FUNCTION enforce_refund_line_scope();

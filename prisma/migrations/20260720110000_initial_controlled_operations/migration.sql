-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "hireDate" TIMESTAMP(3),
    "salary" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION DEFAULT 0,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isWeighed" BOOLEAN NOT NULL DEFAULT false,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "supplierId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "batchNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "stripePaymentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "breakTime" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "tableName" TEXT,
    "recordId" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_results" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "userId" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fiscalMode" TEXT NOT NULL DEFAULT 'NON_FISCAL_SIMULATION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "jurisdictionCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "roundingMode" TEXT NOT NULL DEFAULT 'HALF_UP',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certificationRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" TEXT NOT NULL,
    "taxProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "referenceId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "compound" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_exemptions" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "certificateHash" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_exemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_enrollments" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "capabilities" TEXT[],
    "credentialHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "lastSeenAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "disconnectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "register_shifts" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "openingCashCents" INTEGER NOT NULL,
    "expectedCashCents" INTEGER NOT NULL,
    "countedCashCents" INTEGER,
    "varianceCents" INTEGER,
    "managerApprovedBy" TEXT,
    "managerApprovalNote" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "register_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_checkouts" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "saleId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ONLINE',
    "deviceId" TEXT,
    "offlineSequence" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
    "currency" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "taxProfileVersion" INTEGER NOT NULL,
    "taxSnapshot" JSONB NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "fiscalStatus" TEXT NOT NULL DEFAULT 'NON_FISCAL_SIMULATION',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_checkout_lines" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantityMilliunits" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "taxRuleIds" TEXT[],

    CONSTRAINT "operational_checkout_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_tenders" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "readerDeviceId" TEXT,
    "providerRef" TEXT,
    "tokenReference" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "giftCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_operations" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerRef" TEXT,
    "requestMeta" JSONB NOT NULL,
    "responseMeta" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_receipts" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "fiscalStatus" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_jobs" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT,
    "deviceId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "operatorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_stocks" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL DEFAULT '',
    "onHandMilliunits" INTEGER NOT NULL,
    "reservedMilliunits" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ledger_events" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "deltaMilliunits" INTEGER NOT NULL,
    "resultingMilliunits" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_accounts" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "liabilityCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_transactions" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "checkoutId" TEXT,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_cases" (
    "id" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_lines" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "checkoutLineId" TEXT NOT NULL,
    "quantityMilliunits" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,

    CONSTRAINT "refund_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_runs" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "expectedCashCents" INTEGER NOT NULL,
    "countedCashCents" INTEGER NOT NULL,
    "cashVarianceCents" INTEGER NOT NULL,
    "capturedCardCents" INTEGER NOT NULL,
    "refundedCardCents" INTEGER NOT NULL,
    "providerSettlementRef" TEXT,
    "state" TEXT NOT NULL,
    "managerApprovedBy" TEXT,
    "managerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_outbox" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "externalRef" TEXT,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "accounting_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_audits" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sequence" BIGINT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "previousHash" TEXT NOT NULL,
    "eventHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_variantId_batchNumber_key" ON "inventory_items"("productId", "variantId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "ai_results_feature_createdAt_idx" ON "ai_results"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "ai_results_userId_createdAt_idx" ON "ai_results"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "store_locations_code_key" ON "store_locations"("code");

-- CreateIndex
CREATE INDEX "tax_profiles_locationId_effectiveFrom_effectiveUntil_idx" ON "tax_profiles"("locationId", "effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "tax_profiles_locationId_version_key" ON "tax_profiles"("locationId", "version");

-- CreateIndex
CREATE INDEX "tax_rules_taxProfileId_priority_idx" ON "tax_rules"("taxProfileId", "priority");

-- CreateIndex
CREATE INDEX "tax_exemptions_locationId_validFrom_validUntil_idx" ON "tax_exemptions"("locationId", "validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "tax_exemptions_locationId_customerId_code_key" ON "tax_exemptions"("locationId", "customerId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "device_enrollments_deviceId_key" ON "device_enrollments"("deviceId");

-- CreateIndex
CREATE INDEX "device_enrollments_locationId_status_idx" ON "device_enrollments"("locationId", "status");

-- CreateIndex
CREATE INDEX "register_shifts_locationId_state_idx" ON "register_shifts"("locationId", "state");

-- CreateIndex
CREATE INDEX "register_shifts_userId_state_idx" ON "register_shifts"("userId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "operational_checkouts_saleId_key" ON "operational_checkouts"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "operational_checkouts_receiptNumber_key" ON "operational_checkouts"("receiptNumber");

-- CreateIndex
CREATE INDEX "operational_checkouts_locationId_status_createdAt_idx" ON "operational_checkouts"("locationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "operational_checkouts_locationId_idempotencyKey_key" ON "operational_checkouts"("locationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "operational_checkouts_deviceId_offlineSequence_key" ON "operational_checkouts"("deviceId", "offlineSequence");

-- CreateIndex
CREATE INDEX "operational_checkout_lines_checkoutId_idx" ON "operational_checkout_lines"("checkoutId");

-- CreateIndex
CREATE INDEX "operational_tenders_checkoutId_state_idx" ON "operational_tenders"("checkoutId", "state");

-- CreateIndex
CREATE INDEX "payment_operations_state_updatedAt_idx" ON "payment_operations"("state", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_operations_tenderId_idempotencyKey_key" ON "payment_operations"("tenderId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "operational_receipts_checkoutId_key" ON "operational_receipts"("checkoutId");

-- CreateIndex
CREATE UNIQUE INDEX "operational_receipts_receiptNumber_key" ON "operational_receipts"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_jobs_dedupeKey_key" ON "hardware_jobs"("dedupeKey");

-- CreateIndex
CREATE INDEX "hardware_jobs_deviceId_state_nextAttemptAt_idx" ON "hardware_jobs"("deviceId", "state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "location_stocks_locationId_updatedAt_idx" ON "location_stocks"("locationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "location_stocks_locationId_productId_variantKey_key" ON "location_stocks"("locationId", "productId", "variantKey");

-- CreateIndex
CREATE UNIQUE INDEX "stock_ledger_events_idempotencyKey_key" ON "stock_ledger_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "stock_ledger_events_stockId_createdAt_idx" ON "stock_ledger_events"("stockId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_accounts_codeHash_key" ON "gift_card_accounts"("codeHash");

-- CreateIndex
CREATE INDEX "gift_card_accounts_locationId_status_idx" ON "gift_card_accounts"("locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_transactions_idempotencyKey_key" ON "gift_card_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "gift_card_transactions_giftCardId_createdAt_idx" ON "gift_card_transactions"("giftCardId", "createdAt");

-- CreateIndex
CREATE INDEX "refund_cases_state_createdAt_idx" ON "refund_cases"("state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_cases_checkoutId_idempotencyKey_key" ON "refund_cases"("checkoutId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "refund_lines_refundId_idx" ON "refund_lines"("refundId");

-- CreateIndex
CREATE INDEX "reconciliation_runs_locationId_state_idx" ON "reconciliation_runs"("locationId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_runs_shiftId_key" ON "reconciliation_runs"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_outbox_idempotencyKey_key" ON "accounting_outbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "accounting_outbox_locationId_state_createdAt_idx" ON "accounting_outbox"("locationId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "operational_audits_locationId_createdAt_idx" ON "operational_audits"("locationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "operational_audits_locationId_sequence_key" ON "operational_audits"("locationId", "sequence");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "tax_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_enrollments" ADD CONSTRAINT "device_enrollments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "register_shifts" ADD CONSTRAINT "register_shifts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "register_shifts" ADD CONSTRAINT "register_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "register_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device_enrollments"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkout_lines" ADD CONSTRAINT "operational_checkout_lines_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_checkout_lines" ADD CONSTRAINT "operational_checkout_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_tenders" ADD CONSTRAINT "operational_tenders_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_tenders" ADD CONSTRAINT "operational_tenders_readerDeviceId_fkey" FOREIGN KEY ("readerDeviceId") REFERENCES "device_enrollments"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_tenders" ADD CONSTRAINT "operational_tenders_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "gift_card_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_operations" ADD CONSTRAINT "payment_operations_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "operational_tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_receipts" ADD CONSTRAINT "operational_receipts_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_jobs" ADD CONSTRAINT "hardware_jobs_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_jobs" ADD CONSTRAINT "hardware_jobs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device_enrollments"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stocks" ADD CONSTRAINT "location_stocks_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stocks" ADD CONSTRAINT "location_stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger_events" ADD CONSTRAINT "stock_ledger_events_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "location_stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_accounts" ADD CONSTRAINT "gift_card_accounts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "gift_card_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "operational_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_lines" ADD CONSTRAINT "refund_lines_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "refund_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "register_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_audits" ADD CONSTRAINT "operational_audits_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Monetary, inventory, and status invariants for the controlled workflow.
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_rate_check" CHECK ("rateBps" BETWEEN 0 AND 100000);
ALTER TABLE "register_shifts" ADD CONSTRAINT "register_shifts_cash_check" CHECK ("openingCashCents" >= 0 AND "expectedCashCents" >= 0 AND ("countedCashCents" IS NULL OR "countedCashCents" >= 0));
ALTER TABLE "operational_checkouts" ADD CONSTRAINT "operational_checkouts_money_check" CHECK ("subtotalCents" >= 0 AND "discountCents" >= 0 AND "taxCents" >= 0 AND "totalCents" >= 0 AND "totalCents" = "subtotalCents" - "discountCents" + "taxCents");
ALTER TABLE "operational_checkout_lines" ADD CONSTRAINT "operational_lines_check" CHECK ("quantityMilliunits" > 0 AND "unitPriceCents" >= 0 AND "discountCents" >= 0 AND "taxCents" >= 0 AND "totalCents" >= 0);
ALTER TABLE "operational_tenders" ADD CONSTRAINT "operational_tenders_amount_check" CHECK ("amountCents" > 0);
ALTER TABLE "payment_operations" ADD CONSTRAINT "payment_operations_amount_check" CHECK ("amountCents" > 0);
ALTER TABLE "location_stocks" ADD CONSTRAINT "location_stocks_quantity_check" CHECK ("onHandMilliunits" >= 0 AND "reservedMilliunits" >= 0 AND "reservedMilliunits" <= "onHandMilliunits");
ALTER TABLE "gift_card_accounts" ADD CONSTRAINT "gift_card_balance_check" CHECK ("balanceCents" >= 0 AND "liabilityCents" >= 0);
ALTER TABLE "refund_cases" ADD CONSTRAINT "refund_cases_amount_check" CHECK ("amountCents" > 0);
ALTER TABLE "hardware_jobs" ADD CONSTRAINT "hardware_jobs_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5);

CREATE UNIQUE INDEX "register_shifts_one_open_per_user_location"
ON "register_shifts" ("locationId", "userId") WHERE "state" IN ('OPEN', 'CLOSING');

-- Evidence/ledger rows are append-only at the database layer.
CREATE FUNCTION forbid_operational_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'immutable operational evidence table % cannot be modified', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operational_audits_immutable BEFORE UPDATE OR DELETE ON "operational_audits" FOR EACH ROW EXECUTE FUNCTION forbid_operational_evidence_mutation();
CREATE TRIGGER stock_ledger_events_immutable BEFORE UPDATE OR DELETE ON "stock_ledger_events" FOR EACH ROW EXECUTE FUNCTION forbid_operational_evidence_mutation();
CREATE TRIGGER gift_card_transactions_immutable BEFORE UPDATE OR DELETE ON "gift_card_transactions" FOR EACH ROW EXECUTE FUNCTION forbid_operational_evidence_mutation();
CREATE TRIGGER refund_lines_immutable BEFORE UPDATE OR DELETE ON "refund_lines" FOR EACH ROW EXECUTE FUNCTION forbid_operational_evidence_mutation();

-- Cross-location references fail even if an application authorization check regresses.
CREATE FUNCTION enforce_checkout_scope() RETURNS trigger AS $$
DECLARE shift_location TEXT; shift_user TEXT; device_location TEXT;
BEGIN
  SELECT "locationId", "userId" INTO shift_location, shift_user FROM "register_shifts" WHERE "id" = NEW."shiftId";
  IF shift_location IS NULL OR shift_location <> NEW."locationId" OR shift_user <> NEW."userId" THEN
    RAISE EXCEPTION 'checkout shift/user/location scope mismatch';
  END IF;
  IF NEW."deviceId" IS NOT NULL THEN
    SELECT "locationId" INTO device_location FROM "device_enrollments" WHERE "deviceId" = NEW."deviceId";
    IF device_location IS NULL OR device_location <> NEW."locationId" THEN RAISE EXCEPTION 'checkout workstation location mismatch'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER operational_checkouts_scope BEFORE INSERT OR UPDATE ON "operational_checkouts" FOR EACH ROW EXECUTE FUNCTION enforce_checkout_scope();

CREATE FUNCTION enforce_tender_scope() RETURNS trigger AS $$
DECLARE checkout_location TEXT; reader_location TEXT; gift_location TEXT;
BEGIN
  SELECT "locationId" INTO checkout_location FROM "operational_checkouts" WHERE "id" = NEW."checkoutId";
  IF NEW."readerDeviceId" IS NOT NULL THEN
    SELECT "locationId" INTO reader_location FROM "device_enrollments" WHERE "deviceId" = NEW."readerDeviceId";
    IF reader_location IS NULL OR reader_location <> checkout_location THEN RAISE EXCEPTION 'tender reader location mismatch'; END IF;
  END IF;
  IF NEW."giftCardId" IS NOT NULL THEN
    SELECT "locationId" INTO gift_location FROM "gift_card_accounts" WHERE "id" = NEW."giftCardId";
    IF gift_location IS NULL OR gift_location <> checkout_location THEN RAISE EXCEPTION 'gift card location mismatch'; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER operational_tenders_scope BEFORE INSERT OR UPDATE ON "operational_tenders" FOR EACH ROW EXECUTE FUNCTION enforce_tender_scope();

CREATE FUNCTION preserve_completed_checkout() RETURNS trigger AS $$
BEGIN
  IF OLD."status" IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED') AND
    (OLD."locationId", OLD."shiftId", OLD."userId", OLD."customerId", OLD."currency", OLD."subtotalCents", OLD."discountCents", OLD."taxCents", OLD."totalCents", OLD."taxProfileVersion", OLD."taxSnapshot", OLD."receiptNumber")
    IS DISTINCT FROM
    (NEW."locationId", NEW."shiftId", NEW."userId", NEW."customerId", NEW."currency", NEW."subtotalCents", NEW."discountCents", NEW."taxCents", NEW."totalCents", NEW."taxProfileVersion", NEW."taxSnapshot", NEW."receiptNumber") THEN
      RAISE EXCEPTION 'completed checkout financial record is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER operational_checkouts_preserve BEFORE UPDATE ON "operational_checkouts" FOR EACH ROW EXECUTE FUNCTION preserve_completed_checkout();

CREATE FUNCTION forbid_completed_child_mutation() RETURNS trigger AS $$
DECLARE parent_id TEXT; parent_status TEXT;
BEGIN
  parent_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."checkoutId" ELSE NEW."checkoutId" END;
  SELECT "status" INTO parent_status FROM "operational_checkouts" WHERE "id" = parent_id;
  IF parent_status IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED') THEN RAISE EXCEPTION 'completed checkout child records are immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER operational_lines_preserve BEFORE UPDATE OR DELETE ON "operational_checkout_lines" FOR EACH ROW EXECUTE FUNCTION forbid_completed_child_mutation();
CREATE TRIGGER operational_tenders_preserve BEFORE UPDATE OR DELETE ON "operational_tenders" FOR EACH ROW EXECUTE FUNCTION forbid_completed_child_mutation();

CREATE FUNCTION preserve_receipt_content() RETURNS trigger AS $$
BEGIN
  IF (OLD."checkoutId", OLD."receiptNumber", OLD."content", OLD."contentHash", OLD."fiscalStatus") IS DISTINCT FROM (NEW."checkoutId", NEW."receiptNumber", NEW."content", NEW."contentHash", NEW."fiscalStatus") THEN
    RAISE EXCEPTION 'receipt content is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER operational_receipts_preserve BEFORE UPDATE ON "operational_receipts" FOR EACH ROW EXECUTE FUNCTION preserve_receipt_content();

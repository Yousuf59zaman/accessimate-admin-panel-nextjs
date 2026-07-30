-- Citizen portal enums
CREATE TYPE "WebsiteStatus" AS ENUM ('FREE', 'TRIAL', 'PAID', 'EXPIRED');
CREATE TYPE "ScanType" AS ENUM ('SINGLE', 'SITE');
CREATE TYPE "ScanStatus" AS ENUM ('COMPLETED', 'FAILED');
CREATE TYPE "SubscriptionType" AS ENUM ('TRIAL', 'MONTHLY', 'YEARLY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED');
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE');
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED');
CREATE TYPE "PdfRemediationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCESSIBLE', 'NEEDS_REMEDIATION');
CREATE TYPE "SupportRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- Citizen profile fields remain attached to the independently managed account.
ALTER TABLE "Account"
ADD COLUMN "mobile" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "apiKey" TEXT;

CREATE UNIQUE INDEX "Account_apiKey_key" ON "Account"("apiKey");

CREATE TABLE "CitizenWebsite" (
    "id" SERIAL NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'TRIAL',
    "planName" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CitizenWebsite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessibilityScan" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'COMPLETED',
    "scannedUrl" TEXT NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'Accessimate Engine',
    "verdict" TEXT NOT NULL,
    "wcagVersion" TEXT NOT NULL,
    "complianceLevel" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "issueCategories" JSONB NOT NULL,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "warningsCount" INTEGER NOT NULL DEFAULT 0,
    "noticesCount" INTEGER NOT NULL DEFAULT 0,
    "pagesScanned" INTEGER NOT NULL DEFAULT 1,
    "pagesWithIssues" INTEGER NOT NULL DEFAULT 0,
    "scanDurationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessibilityScan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CitizenSubscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planDescription" TEXT NOT NULL,
    "planSlug" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" "SubscriptionType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CitizenSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CitizenInvoice" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "billAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billDate" TIMESTAMP(3) NOT NULL,
    "paymentDueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CitizenInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CitizenPaymentTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "externalId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CitizenPaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PdfRemediation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "status" "PdfRemediationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "issueCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PdfRemediation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CitizenWebsite_accountId_url_key" ON "CitizenWebsite"("accountId", "url");
CREATE INDEX "CitizenWebsite_accountId_status_updatedAt_idx" ON "CitizenWebsite"("accountId", "status", "updatedAt");
CREATE INDEX "AccessibilityScan_accountId_createdAt_idx" ON "AccessibilityScan"("accountId", "createdAt");
CREATE INDEX "AccessibilityScan_websiteId_createdAt_idx" ON "AccessibilityScan"("websiteId", "createdAt");
CREATE INDEX "CitizenSubscription_accountId_status_idx" ON "CitizenSubscription"("accountId", "status");
CREATE INDEX "CitizenInvoice_accountId_billDate_idx" ON "CitizenInvoice"("accountId", "billDate");
CREATE INDEX "CitizenInvoice_subscriptionId_status_idx" ON "CitizenInvoice"("subscriptionId", "status");
CREATE UNIQUE INDEX "CitizenPaymentTransaction_externalId_key" ON "CitizenPaymentTransaction"("externalId");
CREATE INDEX "CitizenPaymentTransaction_accountId_createdAt_idx" ON "CitizenPaymentTransaction"("accountId", "createdAt");
CREATE INDEX "PdfRemediation_accountId_createdAt_idx" ON "PdfRemediation"("accountId", "createdAt");
CREATE INDEX "PdfRemediation_accountId_status_idx" ON "PdfRemediation"("accountId", "status");
CREATE INDEX "SupportRequest_accountId_status_createdAt_idx" ON "SupportRequest"("accountId", "status", "createdAt");

ALTER TABLE "CitizenWebsite" ADD CONSTRAINT "CitizenWebsite_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessibilityScan" ADD CONSTRAINT "AccessibilityScan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessibilityScan" ADD CONSTRAINT "AccessibilityScan_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "CitizenWebsite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitizenSubscription" ADD CONSTRAINT "CitizenSubscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitizenInvoice" ADD CONSTRAINT "CitizenInvoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitizenInvoice" ADD CONSTRAINT "CitizenInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CitizenSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitizenPaymentTransaction" ADD CONSTRAINT "CitizenPaymentTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CitizenPaymentTransaction" ADD CONSTRAINT "CitizenPaymentTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CitizenSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PdfRemediation" ADD CONSTRAINT "PdfRemediation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

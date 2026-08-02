CREATE TABLE "WidgetAllowedOrigin" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WidgetAllowedOrigin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WidgetSession" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'valid',
    "adjustments" JSONB NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WidgetSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WidgetAllowedOrigin_accountId_origin_key" ON "WidgetAllowedOrigin"("accountId", "origin");
CREATE INDEX "WidgetAllowedOrigin_origin_idx" ON "WidgetAllowedOrigin"("origin");
CREATE UNIQUE INDEX "WidgetSession_cacheKey_key" ON "WidgetSession"("cacheKey");
CREATE INDEX "WidgetSession_origin_idx" ON "WidgetSession"("origin");
CREATE INDEX "WidgetSession_updatedAt_idx" ON "WidgetSession"("updatedAt");

-- Preserve reviewer access when this migration is deployed over the existing
-- production dataset. Fresh databases receive the same row from prisma/seed.ts.
INSERT INTO "WidgetAllowedOrigin" ("id", "accountId", "origin", "createdAt")
SELECT CONCAT('widget-origin-', "id"), "id", '*', CURRENT_TIMESTAMP
FROM "Account"
WHERE "loginId" = 'citizen-reviewer'
ON CONFLICT ("accountId", "origin") DO NOTHING;

ALTER TABLE "WidgetAllowedOrigin" ADD CONSTRAINT "WidgetAllowedOrigin_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WidgetSession" ADD CONSTRAINT "WidgetSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

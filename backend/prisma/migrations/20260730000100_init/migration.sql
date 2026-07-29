-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADMIN', 'CITIZEN');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roles" TEXT[],
    "permissions" TEXT[],
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRecord" (
    "id" SERIAL NOT NULL,
    "resource" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "searchText" TEXT NOT NULL DEFAULT '',
    "identityValue" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "nodeName" TEXT NOT NULL,
    "routeName" TEXT,
    "routeLocation" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'fa-solid fa-circle',
    "status" INTEGER NOT NULL DEFAULT 1,
    "serial" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_loginId_key" ON "Account"("loginId");
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
CREATE INDEX "Account_type_isActive_idx" ON "Account"("type", "isActive");
CREATE INDEX "ResourceRecord_resource_status_deletedAt_idx" ON "ResourceRecord"("resource", "status", "deletedAt");
CREATE INDEX "ResourceRecord_resource_createdAt_idx" ON "ResourceRecord"("resource", "createdAt");
CREATE INDEX "ResourceRecord_resource_identityValue_deletedAt_idx" ON "ResourceRecord"("resource", "identityValue", "deletedAt");
CREATE UNIQUE INDEX "ResourceRecord_active_identity_key" ON "ResourceRecord"("resource", "identityValue") WHERE "deletedAt" IS NULL AND "identityValue" IS NOT NULL;
CREATE INDEX "MenuItem_parentId_serial_idx" ON "MenuItem"("parentId", "serial");
CREATE INDEX "MenuItem_status_serial_idx" ON "MenuItem"("status", "serial");
CREATE INDEX "AuditLog_resource_createdAt_idx" ON "AuditLog"("resource", "createdAt");
CREATE INDEX "AuditLog_accountId_createdAt_idx" ON "AuditLog"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

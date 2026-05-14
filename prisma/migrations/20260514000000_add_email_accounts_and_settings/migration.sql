-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailAccount" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL DEFAULT 'imap.gmail.com',
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "smtpHost" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "appPassword" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailAccount_email_key" ON "EmailAccount"("email");

-- CreateTable
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platformName" TEXT NOT NULL DEFAULT 'LMS Platform',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'We are currently undergoing scheduled maintenance. Please check back soon.',
    "selfEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "defaultBatchCapacity" INTEGER NOT NULL DEFAULT 30,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCompletion" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCertificate" BOOLEAN NOT NULL DEFAULT true,
    "adminAlertEmail" TEXT NOT NULL DEFAULT '',
    "certificateIssuer" TEXT NOT NULL DEFAULT '',
    "autoIssueCertificate" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 1440,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

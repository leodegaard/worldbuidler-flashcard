-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "accountEmail" TEXT,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreSourceNote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "modifiedTime" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "links" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoreSourceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreBatch" (
    "id" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costMicros" INTEGER NOT NULL,
    "warnings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LoreBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreQuestion" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sourceNoteId" TEXT NOT NULL,
    "cardId" TEXT,
    "prompt" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "gapType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "contextSourceIds" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoreQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoreSourceNote_focus_active_idx" ON "LoreSourceNote"("focus", "active");

-- CreateIndex
CREATE INDEX "LoreBatch_status_createdAt_idx" ON "LoreBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LoreBatch_createdAt_idx" ON "LoreBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoreQuestion_cardId_key" ON "LoreQuestion"("cardId");

-- CreateIndex
CREATE INDEX "LoreQuestion_batchId_status_idx" ON "LoreQuestion"("batchId", "status");

-- CreateIndex
CREATE INDEX "LoreQuestion_sourceNoteId_status_idx" ON "LoreQuestion"("sourceNoteId", "status");

-- CreateIndex
CREATE INDEX "LoreQuestion_fingerprint_idx" ON "LoreQuestion"("fingerprint");

-- AddForeignKey
ALTER TABLE "LoreQuestion" ADD CONSTRAINT "LoreQuestion_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LoreBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreQuestion" ADD CONSTRAINT "LoreQuestion_sourceNoteId_fkey" FOREIGN KEY ("sourceNoteId") REFERENCES "LoreSourceNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreQuestion" ADD CONSTRAINT "LoreQuestion_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

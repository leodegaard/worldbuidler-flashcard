-- CreateTable
CREATE TABLE "LoreModelUsage" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costMicros" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoreModelUsage_pkey" PRIMARY KEY ("id")
);

-- Preserve budget accounting for batches generated before usage attempts were
-- tracked independently from accepted batches.
INSERT INTO "LoreModelUsage" (
    "id",
    "model",
    "inputTokens",
    "outputTokens",
    "costMicros",
    "result",
    "createdAt"
)
SELECT
    'backfill-' || "id",
    "model",
    "inputTokens",
    "outputTokens",
    "costMicros",
    'accepted',
    "createdAt"
FROM "LoreBatch";

-- CreateIndex
CREATE INDEX "LoreModelUsage_createdAt_idx" ON "LoreModelUsage"("createdAt");

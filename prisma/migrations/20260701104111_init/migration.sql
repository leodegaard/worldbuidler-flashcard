-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'curated',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Answer_cardId_idx" ON "Answer"("cardId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

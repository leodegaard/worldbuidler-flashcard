-- CreateTable
CREATE TABLE "LoreGenerationLock" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoreGenerationLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "lastProcessedDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- AlterTable: make userId nullable on RecurringTask, add guestSessionId
ALTER TABLE "RecurringTask" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "RecurringTask" ADD COLUMN "guestSessionId" TEXT;

-- AlterTable: make userId nullable on DailyTask, add guestSessionId
ALTER TABLE "DailyTask" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "DailyTask" ADD COLUMN "guestSessionId" TEXT;

-- CreateIndex
CREATE INDEX "RecurringTask_guestSessionId_isActive_idx" ON "RecurringTask"("guestSessionId", "isActive");

-- CreateIndex
CREATE INDEX "DailyTask_guestSessionId_scheduledDate_idx" ON "DailyTask"("guestSessionId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "RecurringTask" ADD CONSTRAINT "RecurringTask_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraint: exactly one of userId or guestSessionId must be non-null
ALTER TABLE "RecurringTask" ADD CONSTRAINT "RecurringTask_owner_check" CHECK (num_nonnulls("userId", "guestSessionId") = 1);
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_owner_check" CHECK (num_nonnulls("userId", "guestSessionId") = 1);

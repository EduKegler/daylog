-- AlterTable: Remove category column from DailyTask
ALTER TABLE "DailyTask" DROP COLUMN IF EXISTS "category";

-- AlterTable: Remove category column from RecurringTask
ALTER TABLE "RecurringTask" DROP COLUMN IF EXISTS "category";

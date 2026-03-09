/*
  Warnings:

  - A unique constraint covering the columns `[recurringTaskId,scheduledDate]` on the table `DailyTask` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DailyTask_recurringTaskId_scheduledDate_key" ON "DailyTask"("recurringTaskId", "scheduledDate");

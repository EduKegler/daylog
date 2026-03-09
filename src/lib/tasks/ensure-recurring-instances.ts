import { prisma } from "@/lib/db/prisma";
import {
  getActiveRecurringTasks,
  getExistingDailyTaskRecurringIds,
  startOfDay,
} from "./queries";
import {
  shouldTaskOccurOnDate,
  parseRecurrenceConfig,
} from "./recurrence";

export async function ensureRecurringInstances(
  userId: string,
  date: Date,
): Promise<void> {
  const dayStart = startOfDay(date);

  const [recurringTasks, existingIds] = await Promise.all([
    getActiveRecurringTasks(userId),
    getExistingDailyTaskRecurringIds(userId, date),
  ]);

  const toCreate = recurringTasks.filter((rt) => {
    if (existingIds.has(rt.id)) return false;
    const config = parseRecurrenceConfig(
      rt.recurrenceType as Parameters<typeof parseRecurrenceConfig>[0],
      rt.recurrenceConfig,
    );
    return shouldTaskOccurOnDate(
      rt.recurrenceType as Parameters<typeof shouldTaskOccurOnDate>[0],
      config,
      dayStart,
    );
  });

  if (toCreate.length === 0) return;

  await prisma.dailyTask.createMany({
    data: toCreate.map((rt) => ({
      userId,
      sourceType: "RECURRING" as const,
      recurringTaskId: rt.id,
      title: rt.title,
      description: rt.description,
      category: rt.category,
      scheduledDate: dayStart,
    })),
  });
}

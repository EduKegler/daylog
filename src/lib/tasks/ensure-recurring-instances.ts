import { prisma } from "@/lib/db/prisma";
import type { OwnerFilter } from "@/lib/auth/owner-context";
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
  filter: OwnerFilter,
  date: Date,
): Promise<void> {
  const dayStart = startOfDay(date);

  const [recurringTasks, existingIds] = await Promise.all([
    getActiveRecurringTasks(filter),
    getExistingDailyTaskRecurringIds(filter, date),
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

  await prisma.$transaction(async (tx) => {
    for (const rt of toCreate) {
      await tx.dailyTask.create({
        data: {
          ...filter,
          sourceType: "RECURRING" as const,
          recurringTaskId: rt.id,
          title: rt.title,
          description: rt.description,
          scheduledDate: dayStart,
          tags: { connect: rt.tags.map((t: { id: string }) => ({ id: t.id })) },
        },
      });
    }
  });
}

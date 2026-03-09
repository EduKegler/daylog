import { prisma } from "@/lib/db/prisma";

// ─── Helpers ──────────────────────────────────

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfNextDay(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

// ─── Recurring Tasks ──────────────────────────

export async function getRecurringTasks(userId: string) {
  return prisma.recurringTask.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function getRecurringTaskById(userId: string, taskId: string) {
  return prisma.recurringTask.findFirst({
    where: { id: taskId, userId },
  });
}

export async function getActiveRecurringTasks(userId: string) {
  return prisma.recurringTask.findMany({
    where: { userId, isActive: true },
  });
}

// ─── Daily Tasks ──────────────────────────────

export async function getDailyTasksForDate(userId: string, date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = startOfNextDay(date);

  return prisma.dailyTask.findMany({
    where: {
      userId,
      scheduledDate: { gte: dayStart, lt: dayEnd },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}

export async function getExistingDailyTaskRecurringIds(
  userId: string,
  date: Date,
): Promise<Set<string>> {
  const dayStart = startOfDay(date);
  const dayEnd = startOfNextDay(date);

  const existing = await prisma.dailyTask.findMany({
    where: {
      userId,
      scheduledDate: { gte: dayStart, lt: dayEnd },
      sourceType: "RECURRING",
      recurringTaskId: { not: null },
    },
    select: { recurringTaskId: true },
  });
  return new Set(existing.map((t) => t.recurringTaskId!));
}

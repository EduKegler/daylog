import { prisma } from "@/lib/db/prisma";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";

// ─── Helpers ──────────────────────────────────

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function startOfNextDay(date: Date): Date {
  const d = startOfDay(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

// ─── Owner Day State ──────────────────────────

export async function getOwnerDayState(ctx: OwnerContext): Promise<{
  timezone: string;
  lastProcessedDate: Date | null;
}> {
  if (ctx.type === "user") {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { timezone: true, lastProcessedDate: true },
    });
    if (!user) {
      throw new Error(`User not found: ${ctx.userId}. Try clearing cookies and signing in again.`);
    }
    return user;
  }

  const session = await prisma.guestSession.findUnique({
    where: { id: ctx.guestSessionId },
    select: { timezone: true, lastProcessedDate: true },
  });
  if (!session) {
    throw new Error(`Guest session not found: ${ctx.guestSessionId}`);
  }
  return session;
}

// ─── Recurring Tasks ──────────────────────────

export async function getRecurringTasks(filter: OwnerFilter) {
  return prisma.recurringTask.findMany({
    where: { ...filter },
    include: {
      tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" as const } },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function getActiveRecurringTasks(filter: OwnerFilter) {
  return prisma.recurringTask.findMany({
    where: { ...filter, isActive: true },
    include: {
      tags: { select: { id: true } },
    },
  });
}

// ─── Daily Tasks ──────────────────────────────

export async function getDailyTasksForDate(filter: OwnerFilter, date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = startOfNextDay(date);

  return prisma.dailyTask.findMany({
    where: {
      ...filter,
      scheduledDate: { gte: dayStart, lt: dayEnd },
      status: { not: "DISMISSED" },
    },
    include: {
      recurringTask: {
        select: { id: true, recurrenceType: true, recurrenceConfig: true },
      },
      tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" as const } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}

export async function getExistingDailyTaskRecurringIds(
  filter: OwnerFilter,
  date: Date,
): Promise<Set<string>> {
  const dayStart = startOfDay(date);
  const dayEnd = startOfNextDay(date);

  const existing = await prisma.dailyTask.findMany({
    where: {
      ...filter,
      scheduledDate: { gte: dayStart, lt: dayEnd },
      sourceType: "RECURRING",
      recurringTaskId: { not: null },
    },
    select: { recurringTaskId: true },
  });
  return new Set(existing.map((t) => t.recurringTaskId!));
}

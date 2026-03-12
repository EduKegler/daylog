import { prisma } from "@/lib/db/prisma";
import type { DailyTask } from "@/generated/prisma/client";
import type { OwnerFilter } from "@/lib/auth/owner-context";
import { computeDayStats, type DayStats } from "@/lib/stats/day-stats";

export type HistoryDay = {
  date: Date;
  tasks: DailyTask[];
  stats: DayStats;
};

export async function getHistory(
  filter: OwnerFilter,
  beforeDate: Date,
  page: number,
  pageSize: number,
): Promise<{ days: HistoryDay[]; hasMore: boolean }> {
  // Query 1: distinct dates paginated directly in the database
  const groupedDates = await prisma.dailyTask.groupBy({
    by: ["scheduledDate"],
    where: { ...filter, scheduledDate: { lt: beforeDate }, status: { not: "DISMISSED" } },
    orderBy: { scheduledDate: "desc" },
    skip: page * pageSize,
    take: pageSize + 1,
  });

  const hasMore = groupedDates.length > pageSize;
  const paginatedDates = groupedDates
    .slice(0, pageSize)
    .map((g) => g.scheduledDate);

  if (paginatedDates.length === 0) {
    return { days: [], hasMore: false };
  }

  // Query 2: fetch all tasks for these dates
  const tasks = await prisma.dailyTask.findMany({
    where: {
      ...filter,
      scheduledDate: { in: paginatedDates },
      status: { not: "DISMISSED" },
    },
    include: { tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  // Group by date and compute stats
  const tasksByDate = new Map<number, DailyTask[]>();
  for (const task of tasks) {
    const time = task.scheduledDate.getTime();
    const list = tasksByDate.get(time) ?? [];
    list.push(task);
    tasksByDate.set(time, list);
  }

  const days: HistoryDay[] = paginatedDates.map((date) => {
    const dayTasks = tasksByDate.get(date.getTime()) ?? [];
    return {
      date,
      tasks: dayTasks,
      stats: computeDayStats(dayTasks),
    };
  });

  return { days, hasMore };
}

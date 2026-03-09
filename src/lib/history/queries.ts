import { prisma } from "@/lib/db/prisma";
import type { DailyTask } from "@/generated/prisma";
import { computeDayStats, type DayStats } from "@/lib/stats/day-stats";

export type HistoryDay = {
  date: Date;
  tasks: DailyTask[];
  stats: DayStats;
};

export async function getHistory(
  userId: string,
  beforeDate: Date,
  page: number,
  pageSize: number,
): Promise<{ days: HistoryDay[]; hasMore: boolean }> {
  // Query 1: datas distintas paginadas diretamente no banco
  const groupedDates = await prisma.dailyTask.groupBy({
    by: ["scheduledDate"],
    where: { userId, scheduledDate: { lt: beforeDate } },
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

  // Query 2: buscar todas as tarefas dessas datas
  const tasks = await prisma.dailyTask.findMany({
    where: {
      userId,
      scheduledDate: { in: paginatedDates },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  // Agrupar por data e computar stats
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

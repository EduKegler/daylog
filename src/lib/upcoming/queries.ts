import { prisma } from "@/lib/db/prisma";
import type { DailyTask } from "@/generated/prisma/client";
import type { OwnerFilter } from "@/lib/auth/owner-context";

export type UpcomingDay = {
  date: Date;
  tasks: DailyTask[];
};

export async function getUpcomingTasks(
  filter: OwnerFilter,
  afterDate: Date,
  limit = 50,
): Promise<UpcomingDay[]> {
  const tasks = await prisma.dailyTask.findMany({
    where: { ...filter, scheduledDate: { gt: afterDate } },
    include: { tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } } },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const tasksByDate = new Map<number, DailyTask[]>();
  for (const task of tasks) {
    const time = task.scheduledDate.getTime();
    const list = tasksByDate.get(time) ?? [];
    list.push(task);
    tasksByDate.set(time, list);
  }

  const days: UpcomingDay[] = [];
  for (const [, dayTasks] of tasksByDate) {
    days.push({ date: dayTasks[0].scheduledDate, tasks: dayTasks });
  }

  return days;
}

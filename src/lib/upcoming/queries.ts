import { prisma } from "@/lib/db/prisma";
import type { DailyTask } from "@/generated/prisma";

export type UpcomingDay = {
  date: Date;
  tasks: DailyTask[];
};

export async function getUpcomingTasks(
  userId: string,
  afterDate: Date,
): Promise<UpcomingDay[]> {
  const tasks = await prisma.dailyTask.findMany({
    where: { userId, scheduledDate: { gt: afterDate } },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
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

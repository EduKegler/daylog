import { prisma } from "@/lib/db/prisma";
import { startOfDay, startOfNextDay } from "./queries";

export type CreateTaskInput = {
  userId: string;
  title: string;
  description?: string;
  category?: string;
  scheduledDate: Date;
};

export async function createTask(input: CreateTaskInput) {
  return prisma.dailyTask.create({
    data: {
      userId: input.userId,
      sourceType: "MANUAL",
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      scheduledDate: startOfDay(input.scheduledDate),
    },
  });
}

export async function completeTask(
  taskId: string,
  userId: string,
): Promise<void> {
  const { count } = await prisma.dailyTask.updateMany({
    where: { id: taskId, userId, status: { not: "COMPLETED" } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  if (count === 0) throw new Error("Task not found or already completed");
}

export async function uncompleteTask(
  taskId: string,
  userId: string,
): Promise<void> {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfNextDay(now);

  const { count } = await prisma.dailyTask.updateMany({
    where: {
      id: taskId,
      userId,
      status: "COMPLETED",
      completedAt: { gte: today, lt: tomorrow },
    },
    data: { status: "PENDING", completedAt: null },
  });

  if (count === 0) throw new Error("Task not found or cannot be uncompleted");
}

export async function updateDailyTask(
  taskId: string,
  userId: string,
  data: {
    title: string;
    description: string | null;
    category: string | null;
    scheduledDate?: Date;
  },
): Promise<void> {
  const updateData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    category: data.category,
  };
  if (data.scheduledDate) {
    updateData.scheduledDate = startOfDay(data.scheduledDate);
  }

  const { count } = await prisma.dailyTask.updateMany({
    where: { id: taskId, userId },
    data: updateData,
  });

  if (count === 0) throw new Error("Task not found or unauthorized");
}

export async function deleteTask(
  taskId: string,
  userId: string,
): Promise<void> {
  const { count } = await prisma.dailyTask.deleteMany({
    where: { id: taskId, userId },
  });

  if (count === 0) throw new Error("Task not found or unauthorized");
}

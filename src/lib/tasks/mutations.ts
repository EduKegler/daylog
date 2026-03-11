import { prisma } from "@/lib/db/prisma";
import type { OwnerFilter } from "@/lib/auth/owner-context";
import { startOfDay, startOfNextDay } from "./queries";

export type CreateTaskInput = {
  title: string;
  description?: string;
  category?: string;
  scheduledDate: Date;
} & OwnerFilter;

export async function createTask(input: CreateTaskInput) {
  const { title, description, category, scheduledDate, ...ownerFilter } = input;
  return prisma.dailyTask.create({
    data: {
      ...ownerFilter,
      sourceType: "MANUAL",
      title,
      description: description || null,
      category: category || null,
      scheduledDate: startOfDay(scheduledDate),
    },
  });
}

export async function completeTask(
  taskId: string,
  filter: OwnerFilter,
): Promise<void> {
  const { count } = await prisma.dailyTask.updateMany({
    where: { id: taskId, ...filter, status: { not: "COMPLETED" } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  if (count === 0) throw new Error("Task not found or already completed");
}

export async function uncompleteTask(
  taskId: string,
  filter: OwnerFilter,
): Promise<void> {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfNextDay(now);

  const { count } = await prisma.dailyTask.updateMany({
    where: {
      id: taskId,
      ...filter,
      status: "COMPLETED",
      completedAt: { gte: today, lt: tomorrow },
    },
    data: { status: "PENDING", completedAt: null },
  });

  if (count === 0) throw new Error("Task not found or cannot be uncompleted");
}

export async function updateDailyTask(
  taskId: string,
  filter: OwnerFilter,
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
    where: { id: taskId, ...filter },
    data: updateData,
  });

  if (count === 0) throw new Error("Task not found or unauthorized");
}

export async function deleteTask(
  taskId: string,
  filter: OwnerFilter,
): Promise<void> {
  const { count } = await prisma.dailyTask.deleteMany({
    where: { id: taskId, ...filter },
  });

  if (count === 0) throw new Error("Task not found or unauthorized");
}

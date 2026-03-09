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
  const task = await prisma.dailyTask.findUnique({ where: { id: taskId } });

  if (!task) throw new Error("Task not found");
  if (task.userId !== userId) throw new Error("Unauthorized");
  if (task.status === "COMPLETED") throw new Error("Already completed");

  await prisma.dailyTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function uncompleteTask(
  taskId: string,
  userId: string,
): Promise<void> {
  const task = await prisma.dailyTask.findUnique({ where: { id: taskId } });

  if (!task) throw new Error("Task not found");
  if (task.userId !== userId) throw new Error("Unauthorized");
  if (task.status !== "COMPLETED") throw new Error("Task is not completed");

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfNextDay(now);
  const completedDate = task.completedAt;

  if (completedDate && (completedDate < today || completedDate >= tomorrow)) {
    throw new Error("Can only uncomplete tasks completed today");
  }

  await prisma.dailyTask.update({
    where: { id: taskId },
    data: { status: "PENDING", completedAt: null },
  });
}

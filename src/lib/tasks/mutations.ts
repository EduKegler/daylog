import { prisma } from "@/lib/db/prisma";
import type { OwnerFilter } from "@/lib/auth/owner-context";
import { startOfDay, startOfNextDay } from "./queries";

export type CreateTaskInput = {
  title: string;
  description?: string;
  tagIds: string[];
  scheduledDate: Date;
} & OwnerFilter;

export async function createTask(input: CreateTaskInput) {
  const { title, description, tagIds, scheduledDate, ...ownerFilter } = input;
  return prisma.dailyTask.create({
    data: {
      ...ownerFilter,
      sourceType: "MANUAL",
      title,
      description: description || null,
      scheduledDate: startOfDay(scheduledDate),
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });
}

export async function completeTask(
  taskId: string,
  filter: OwnerFilter,
): Promise<void> {
  const { count } = await prisma.dailyTask.updateMany({
    where: { id: taskId, ...filter, status: { notIn: ["COMPLETED", "DISMISSED"] } },
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
  data: { title?: string; description?: string | null; tagIds?: string[]; scheduledDate?: Date },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const task = await tx.dailyTask.findFirst({ where: { id: taskId, ...filter } });
    if (!task) return;

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledDate !== undefined) updateData.scheduledDate = startOfDay(data.scheduledDate);

    await tx.dailyTask.update({
      where: { id: taskId },
      data: {
        ...updateData,
        ...(data.tagIds !== undefined ? { tags: { set: data.tagIds.map((id) => ({ id })) } } : {}),
      },
    });
  });
}

export async function syncPendingRecurringInstances(
  recurringTaskId: string,
  data: { title: string; description: string | null; tagIds: string[] },
): Promise<void> {
  const { count } = await prisma.dailyTask.updateMany({
    where: { recurringTaskId, status: "PENDING" },
    data: { title: data.title, description: data.description },
  });

  if (count === 0) return;

  const pendingInstances = await prisma.dailyTask.findMany({
    where: { recurringTaskId, status: "PENDING" },
    select: { id: true },
  });

  for (const instance of pendingInstances) {
    await prisma.dailyTask.update({
      where: { id: instance.id },
      data: { tags: { set: data.tagIds.map((id) => ({ id })) } },
    });
  }
}

export async function deleteTask(
  taskId: string,
  filter: OwnerFilter,
): Promise<void> {
  const task = await prisma.dailyTask.findFirst({
    where: { id: taskId, ...filter },
    select: { sourceType: true, recurringTaskId: true },
  });

  if (!task) throw new Error("Task not found or unauthorized");

  if (task.sourceType === "RECURRING" && task.recurringTaskId !== null) {
    await prisma.dailyTask.update({
      where: { id: taskId },
      data: { status: "DISMISSED" },
    });
  } else {
    await prisma.dailyTask.delete({ where: { id: taskId } });
  }
}

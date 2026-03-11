"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateRecurringTaskInput } from "./validation";

export type ActionResult = {
  success: boolean;
  errors?: Record<string, string>;
};

export async function createRecurringTask(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();

  const result = validateRecurringTaskInput({
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    recurrenceType: formData.get("recurrenceType") as string,
    recurrenceConfig: formData.get("recurrenceConfig") as string,
  });

  if (!result.success) {
    return { success: false, errors: result.errors };
  }

  await prisma.recurringTask.create({
    data: {
      userId: user.id!,
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      recurrenceType: result.data.recurrenceType,
      recurrenceConfig: result.data.recurrenceConfig,
    },
  });

  return { success: true };
}

export async function updateRecurringTask(
  taskId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  const existing = await prisma.recurringTask.findFirst({
    where: { id: taskId, userId: user.id! },
  });

  if (!existing) {
    return { success: false, errors: { _form: "Task not found" } };
  }

  const result = validateRecurringTaskInput({
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    recurrenceType: formData.get("recurrenceType") as string,
    recurrenceConfig: formData.get("recurrenceConfig") as string,
  });

  if (!result.success) {
    return { success: false, errors: result.errors };
  }

  await prisma.recurringTask.update({
    where: { id: taskId },
    data: {
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      recurrenceType: result.data.recurrenceType,
      recurrenceConfig: result.data.recurrenceConfig,
    },
  });

  return { success: true };
}

export async function toggleRecurringTask(taskId: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  const task = await prisma.recurringTask.findFirst({
    where: { id: taskId, userId: user.id! },
  });

  if (!task) {
    return { success: false, errors: { _form: "Task not found" } };
  }

  await prisma.recurringTask.update({
    where: { id: taskId },
    data: { isActive: !task.isActive },
  });

  return { success: true };
}

export async function deleteRecurringTask(taskId: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  const task = await prisma.recurringTask.findFirst({
    where: { id: taskId, userId: user.id! },
  });

  if (!task) {
    return { success: false, errors: { _form: "Task not found" } };
  }

  await prisma.recurringTask.delete({ where: { id: taskId } });

  return { success: true };
}

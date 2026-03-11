"use server";

import { prisma } from "@/lib/db/prisma";
import { resolveWriteContext, resolveOwnerContext, buildOwnerFilter } from "@/lib/auth/owner-context";
import { validateRecurringTaskInput } from "./validation";
import { checkGuestRecurringTaskLimit } from "@/lib/guest/rate-limiter";

export type ActionResult = {
  success: boolean;
  errors?: Record<string, string>;
};

export async function createRecurringTask(formData: FormData): Promise<ActionResult> {
  const ctx = await resolveWriteContext();
  const filter = buildOwnerFilter(ctx);

  if (ctx.type === "guest" && !checkGuestRecurringTaskLimit(ctx.guestSessionId)) {
    return { success: false, errors: { _form: "Guest recurring task limit reached" } };
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

  await prisma.recurringTask.create({
    data: {
      ...filter,
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
  const ctx = await resolveOwnerContext();
  if (!ctx) return { success: false, errors: { _form: "No active session" } };
  const filter = buildOwnerFilter(ctx);

  const existing = await prisma.recurringTask.findFirst({
    where: { id: taskId, ...filter },
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
  const ctx = await resolveOwnerContext();
  if (!ctx) return { success: false, errors: { _form: "No active session" } };
  const filter = buildOwnerFilter(ctx);

  const task = await prisma.recurringTask.findFirst({
    where: { id: taskId, ...filter },
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
  const ctx = await resolveOwnerContext();
  if (!ctx) return { success: false, errors: { _form: "No active session" } };
  const filter = buildOwnerFilter(ctx);

  const task = await prisma.recurringTask.findFirst({
    where: { id: taskId, ...filter },
  });

  if (!task) {
    return { success: false, errors: { _form: "Task not found" } };
  }

  await prisma.recurringTask.delete({ where: { id: taskId } });

  return { success: true };
}

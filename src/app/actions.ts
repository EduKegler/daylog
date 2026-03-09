"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createTask, deleteTask, updateDailyTask, completeTask, uncompleteTask } from "@/lib/tasks/mutations";
import { validateTaskInput, validateCommonFields } from "@/lib/tasks/validation";
import type { ActionResult } from "@/lib/tasks/actions";

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();

  const result = validateTaskInput({
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    scheduledDate: formData.get("scheduledDate") as string,
  });

  if (!result.success) {
    return { success: false, errors: result.errors };
  }

  await createTask({
    userId: user.id,
    title: result.data.title,
    description: result.data.description ?? undefined,
    category: result.data.category ?? undefined,
    scheduledDate: result.data.scheduledDate,
  });

  revalidatePath("/");
  revalidatePath("/upcoming");
  return { success: true };
}

export async function completeTaskAction(taskId: string) {
  const user = await getCurrentUser();
  await completeTask(taskId, user.id);
  revalidatePath("/");
}

export async function uncompleteTaskAction(taskId: string) {
  const user = await getCurrentUser();
  await uncompleteTask(taskId, user.id);
  revalidatePath("/");
}

export async function updateTaskAction(
  taskId: string,
  data: { title: string; description: string | null; category: string | null },
) {
  const { title, description, category, errors } = validateCommonFields({
    title: data.title,
    description: data.description ?? undefined,
    category: data.category ?? undefined,
  });

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] as string);
  }

  const user = await getCurrentUser();
  await updateDailyTask(taskId, user.id, { title, description, category });
  revalidatePath("/");
  revalidatePath("/upcoming");
}

export async function deleteTaskAction(taskId: string) {
  const user = await getCurrentUser();
  await deleteTask(taskId, user.id);
  revalidatePath("/");
  revalidatePath("/upcoming");
}

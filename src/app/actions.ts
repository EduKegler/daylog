"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createTask } from "@/lib/tasks/mutations";
import { completeTask, uncompleteTask } from "@/lib/tasks/mutations";
import { validateTaskInput } from "@/lib/tasks/validation";
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

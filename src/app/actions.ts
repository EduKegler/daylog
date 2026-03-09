"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createTask } from "@/lib/tasks/mutations";
import { completeTask, uncompleteTask } from "@/lib/tasks/mutations";

export async function createTaskAction(formData: FormData) {
  const user = await getCurrentUser();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const category = (formData.get("category") as string) || undefined;
  const dateStr = formData.get("scheduledDate") as string;
  const scheduledDate = dateStr ? new Date(dateStr + "T12:00:00") : new Date();

  if (!title?.trim()) {
    throw new Error("Title is required");
  }

  await createTask({
    userId: user.id,
    title: title.trim(),
    description: description?.trim(),
    category: category?.trim(),
    scheduledDate,
  });

  revalidatePath("/");
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

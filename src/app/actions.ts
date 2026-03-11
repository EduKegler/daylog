"use server";

import { resolveWriteContext, resolveOwnerContext, buildOwnerFilter } from "@/lib/auth/owner-context";
import { createTask, deleteTask, updateDailyTask, completeTask, uncompleteTask } from "@/lib/tasks/mutations";
import { validateTaskInput, validateCommonFields } from "@/lib/tasks/validation";
import { checkGuestDailyTaskLimit } from "@/lib/guest/rate-limiter";
import type { ActionResult } from "@/lib/tasks/actions";

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const ctx = await resolveWriteContext();
    const filter = buildOwnerFilter(ctx);

    if (ctx.type === "guest" && !checkGuestDailyTaskLimit(ctx.guestSessionId)) {
      return { success: false, errors: { _form: "Guest daily task limit reached" } };
    }

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
      ...filter,
      title: result.data.title,
      description: result.data.description ?? undefined,
      category: result.data.category ?? undefined,
      scheduledDate: result.data.scheduledDate,
    });

    return { success: true };
  } catch (error) {
    console.error("[createTaskAction] Error:", error);
    return { success: false, errors: { _form: "Failed to create task. Please try again." } };
  }
}

export async function completeTaskAction(taskId: string) {
  const ctx = await resolveOwnerContext();
  if (!ctx) throw new Error("No active session");
  await completeTask(taskId, buildOwnerFilter(ctx));
}

export async function uncompleteTaskAction(taskId: string) {
  const ctx = await resolveOwnerContext();
  if (!ctx) throw new Error("No active session");
  await uncompleteTask(taskId, buildOwnerFilter(ctx));
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title: string;
    description: string | null;
    category: string | null;
    scheduledDate?: string;
  },
): Promise<ActionResult> {
  const ctx = await resolveOwnerContext();
  if (!ctx) return { success: false, errors: { _form: "No active session" } };
  const filter = buildOwnerFilter(ctx);

  if (data.scheduledDate) {
    const result = validateTaskInput({
      title: data.title,
      description: data.description ?? undefined,
      category: data.category ?? undefined,
      scheduledDate: data.scheduledDate,
    });

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    await updateDailyTask(taskId, filter, {
      title: result.data.title,
      description: result.data.description,
      category: result.data.category,
      scheduledDate: result.data.scheduledDate,
    });
  } else {
    const { title, description, category, errors } = validateCommonFields({
      title: data.title,
      description: data.description ?? undefined,
      category: data.category ?? undefined,
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    await updateDailyTask(taskId, filter, { title, description, category });
  }

  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const ctx = await resolveOwnerContext();
  if (!ctx) throw new Error("No active session");
  await deleteTask(taskId, buildOwnerFilter(ctx));
}

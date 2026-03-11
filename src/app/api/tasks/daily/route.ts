import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { getDailyTasksForDate } from "@/lib/tasks/queries";
import { serializeTask } from "@/lib/tasks/serialize";

export async function GET() {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);

  await ensureRecurringInstances(user.id, today);
  const tasks = await getDailyTasksForDate(user.id, today);

  return NextResponse.json({
    today: today.toISOString(),
    tasks: tasks.map(serializeTask),
  });
}

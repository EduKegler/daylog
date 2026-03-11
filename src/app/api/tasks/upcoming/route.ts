import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getUpcomingTasks } from "@/lib/upcoming/queries";
import { serializeTask } from "@/lib/tasks/serialize";

export async function GET() {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);
  const days = await getUpcomingTasks(user.id, today);

  return NextResponse.json({
    today: today.toISOString(),
    days: days.map((day) => ({
      date: day.date.toISOString(),
      tasks: day.tasks.map(serializeTask),
    })),
  });
}

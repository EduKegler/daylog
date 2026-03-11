import { NextResponse } from "next/server";
import { resolveOwnerContext, buildOwnerFilter } from "@/lib/auth/owner-context";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getUpcomingTasks } from "@/lib/upcoming/queries";
import { serializeTask } from "@/lib/tasks/serialize";

export async function GET() {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json({ today: new Date().toISOString(), days: [] });
  }

  const today = getUserLocalDate(ctx.timezone);
  const days = await getUpcomingTasks(buildOwnerFilter(ctx), today);

  return NextResponse.json({
    today: today.toISOString(),
    days: days.map((day) => ({
      date: day.date.toISOString(),
      tasks: day.tasks.map(serializeTask),
    })),
  });
}

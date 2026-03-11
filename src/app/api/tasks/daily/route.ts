import { NextResponse } from "next/server";
import { resolveOwnerContext, buildOwnerFilter } from "@/lib/auth/owner-context";
import { getOwnerDayState } from "@/lib/tasks/queries";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { processRollover } from "@/lib/tasks/rollover";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { getDailyTasksForDate } from "@/lib/tasks/queries";
import { serializeTask } from "@/lib/tasks/serialize";

export async function GET() {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json({ today: new Date().toISOString(), tasks: [] });
  }

  const filter = buildOwnerFilter(ctx);
  const today = getUserLocalDate(ctx.timezone);

  // Lazy rollover for guests (and users who missed the cron)
  const dayState = await getOwnerDayState(ctx);
  if (
    dayState.lastProcessedDate === null ||
    dayState.lastProcessedDate.getTime() < today.getTime()
  ) {
    await processRollover(ctx, dayState.lastProcessedDate, today);
  }

  await ensureRecurringInstances(filter, today);
  const tasks = await getDailyTasksForDate(filter, today);

  return NextResponse.json({
    today: today.toISOString(),
    tasks: tasks.map(serializeTask),
  });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getHistory } from "@/lib/history/queries";
import { serializeTask } from "@/lib/tasks/serialize";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);

  const { days, hasMore } = await getHistory(user.id, today, page, 7);

  return NextResponse.json({
    days: days.map((day) => ({
      date: day.date.toISOString(),
      stats: day.stats,
      tasks: day.tasks.map(serializeTask),
    })),
    hasMore,
  });
}

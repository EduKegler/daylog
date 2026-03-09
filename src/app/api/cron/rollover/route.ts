import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { processRollover } from "@/lib/tasks/rollover";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, timezone: true, lastProcessedDate: true },
  });

  const results = [];

  for (const user of users) {
    const today = getUserLocalDate(user.timezone);

    if (!user.lastProcessedDate || user.lastProcessedDate.getTime() < today.getTime()) {
      const rollover = await processRollover(user.id, user.lastProcessedDate, today);
      await ensureRecurringInstances(user.id, today);
      results.push({ userId: user.id, carriedOver: rollover.carriedOver });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

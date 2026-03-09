import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { computeDayStats } from "@/lib/stats/day-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Auth session
  try {
    const session = await auth();
    checks.auth = { ok: true, hasSession: !!session, hasUser: !!session?.user?.id };
  } catch (e) {
    checks.auth = { ok: false, error: String(e) };
  }

  // 2. Database connection
  try {
    const count = await prisma.user.count();
    checks.database = { ok: true, userCount: count };
  } catch (e) {
    checks.database = { ok: false, error: String(e) };
  }

  // 3. User query with lastProcessedDate
  try {
    const user = await prisma.user.findFirst({
      select: { id: true, timezone: true, lastProcessedDate: true },
    });
    checks.userQuery = { ok: true, hasUser: !!user, timezone: user?.timezone };
  } catch (e) {
    checks.userQuery = { ok: false, error: String(e) };
  }

  // 4. getUserLocalDate
  try {
    const date = getUserLocalDate("America/Sao_Paulo");
    checks.localDate = { ok: true, date: date.toISOString() };
  } catch (e) {
    checks.localDate = { ok: false, error: String(e) };
  }

  // 5. computeDayStats
  try {
    const stats = computeDayStats([]);
    checks.dayStats = { ok: true, stats };
  } catch (e) {
    checks.dayStats = { ok: false, error: String(e) };
  }

  // 6. Daily tasks query
  try {
    const tasks = await prisma.dailyTask.findMany({ take: 1 });
    checks.dailyTasks = { ok: true, count: tasks.length };
  } catch (e) {
    checks.dailyTasks = { ok: false, error: String(e) };
  }

  // 7. Recurring tasks query
  try {
    const tasks = await prisma.recurringTask.findMany({ take: 1 });
    checks.recurringTasks = { ok: true, count: tasks.length };
  } catch (e) {
    checks.recurringTasks = { ok: false, error: String(e) };
  }

  // 8. Environment
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "NOT SET",
    AUTH_URL: process.env.AUTH_URL ?? "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Database connection
  try {
    const count = await prisma.user.count();
    checks.database = { ok: true, userCount: count };
  } catch (e) {
    checks.database = { ok: false, error: String(e) };
  }

  // 2. Auth environment variables
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "NOT SET",
    AUTH_URL: process.env.AUTH_URL ?? "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL ?? "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  // 3. Test getUserDayState-like query (the main dashboard query)
  try {
    const user = await prisma.user.findFirst({
      select: { id: true, timezone: true, lastProcessedDate: true },
    });
    checks.userQuery = { ok: true, hasUser: !!user };
  } catch (e) {
    checks.userQuery = { ok: false, error: String(e) };
  }

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { processCronRollover } from "@/lib/tasks/cron-rollover";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processCronRollover();
  return NextResponse.json(result);
}

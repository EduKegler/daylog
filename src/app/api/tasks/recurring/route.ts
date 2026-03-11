import { NextResponse } from "next/server";
import { resolveOwnerContext, buildOwnerFilter } from "@/lib/auth/owner-context";
import { getRecurringTasks } from "@/lib/tasks/queries";

export async function GET() {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json([]);
  }

  const tasks = await getRecurringTasks(buildOwnerFilter(ctx));

  return NextResponse.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      recurrenceType: t.recurrenceType,
      recurrenceConfig: t.recurrenceConfig,
      isActive: t.isActive,
    })),
  );
}

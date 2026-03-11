import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getRecurringTasks } from "@/lib/tasks/queries";

export async function GET() {
  const user = await getCurrentUser();
  const tasks = await getRecurringTasks(user.id!);

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

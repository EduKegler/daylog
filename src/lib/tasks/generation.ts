import type { PrismaClient } from "@/generated/prisma";
import {
  parseRecurrenceConfig,
  shouldTaskOccurOnDate,
} from "./recurrence";

export type GenerationResult = {
  created: number;
  skipped: number;
};

export async function generateDailyTasks(
  db: PrismaClient,
  userId: string,
  date: Date,
): Promise<GenerationResult> {
  // Normalizar data para midnight UTC
  const scheduledDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  // Buscar recorrentes ativas
  const recurringTasks = await db.recurringTask.findMany({
    where: { userId, isActive: true },
  });

  if (recurringTasks.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // Buscar DailyTasks já existentes para deduplicação
  const existing = await db.dailyTask.findMany({
    where: {
      userId,
      scheduledDate,
      sourceType: "RECURRING",
      recurringTaskId: { not: null },
    },
    select: { recurringTaskId: true },
  });
  const existingIds = new Set(existing.map((t) => t.recurringTaskId!));

  let created = 0;
  let skipped = 0;

  const toCreate: Array<{
    userId: string;
    sourceType: "RECURRING";
    recurringTaskId: string;
    title: string;
    description: string | null;
    category: string | null;
    scheduledDate: Date;
  }> = [];

  for (const task of recurringTasks) {
    // Já existe?
    if (existingIds.has(task.id)) {
      skipped++;
      continue;
    }

    // Deve ocorrer nesta data?
    const config = parseRecurrenceConfig(
      task.recurrenceType as "DAILY" | "WEEKDAYS" | "SPECIFIC_WEEKDAYS" | "MONTHLY",
      task.recurrenceConfig,
    );
    if (!shouldTaskOccurOnDate(
      task.recurrenceType as "DAILY" | "WEEKDAYS" | "SPECIFIC_WEEKDAYS" | "MONTHLY",
      config,
      scheduledDate,
    )) {
      continue;
    }

    toCreate.push({
      userId,
      sourceType: "RECURRING",
      recurringTaskId: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      scheduledDate,
    });
    created++;
  }

  if (toCreate.length > 0) {
    await db.dailyTask.createMany({ data: toCreate });
  }

  return { created, skipped };
}

export function getUserLocalDate(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.format(now).split("-");
  return new Date(
    Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])),
  );
}

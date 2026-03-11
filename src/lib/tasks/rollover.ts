import { prisma } from "@/lib/db/prisma";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";
import { buildOwnerFilter } from "@/lib/auth/owner-context";

export type RolloverResult = {
  carriedOver: number;
};

function buildLastProcessedDateUpdate(
  ctx: OwnerContext,
  today: Date,
) {
  if (ctx.type === "user") {
    return prisma.user.update({
      where: { id: ctx.userId },
      data: { lastProcessedDate: today },
    });
  }
  return prisma.guestSession.update({
    where: { id: ctx.guestSessionId },
    data: { lastProcessedDate: today },
  });
}

export async function processRollover(
  ctx: OwnerContext,
  lastProcessedDate: Date | null,
  today: Date,
): Promise<RolloverResult> {
  const filter: OwnerFilter = buildOwnerFilter(ctx);

  // Primeiro acesso: apenas marca o dia
  if (lastProcessedDate === null) {
    await buildLastProcessedDateUpdate(ctx, today);
    return { carriedOver: 0 };
  }

  // Already processed today: no-op
  if (lastProcessedDate.getTime() >= today.getTime()) {
    return { carriedOver: 0 };
  }

  // Fetch pending manual tasks from the last processed date
  const pendingManual = await prisma.dailyTask.findMany({
    where: {
      ...filter,
      scheduledDate: lastProcessedDate,
      sourceType: "MANUAL",
      status: "PENDING",
    },
  });

  if (pendingManual.length === 0) {
    await buildLastProcessedDateUpdate(ctx, today);
    return { carriedOver: 0 };
  }

  // Build carry-overs preserving originalDate
  const carryOvers = pendingManual.map((task) => ({
    ...filter,
    sourceType: "MANUAL" as const,
    title: task.title,
    description: task.description,
    category: task.category,
    scheduledDate: today,
    originalDate: task.originalDate ?? task.scheduledDate,
  }));

  // Atomic transaction: create carry-overs + mark sources as SKIPPED + update lastProcessedDate
  await prisma.$transaction([
    prisma.dailyTask.createMany({ data: carryOvers }),
    prisma.dailyTask.updateMany({
      where: {
        id: { in: pendingManual.map((t) => t.id) },
      },
      data: { status: "SKIPPED" },
    }),
    buildLastProcessedDateUpdate(ctx, today),
  ]);

  return { carriedOver: carryOvers.length };
}

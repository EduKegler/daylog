import { prisma } from "@/lib/db/prisma";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";
import { buildOwnerFilter } from "@/lib/auth/owner-context";

export type RolloverResult = {
  carriedOver: number;
};

export async function processRollover(
  ctx: OwnerContext,
  lastProcessedDate: Date | null,
  today: Date,
): Promise<RolloverResult> {
  const filter: OwnerFilter = buildOwnerFilter(ctx);

  // Primeiro acesso: apenas marca o dia
  if (lastProcessedDate === null) {
    if (ctx.type === "user") {
      await prisma.user.update({
        where: { id: ctx.userId },
        data: { lastProcessedDate: today },
      });
    } else {
      await prisma.guestSession.update({
        where: { id: ctx.guestSessionId },
        data: { lastProcessedDate: today },
      });
    }
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
    include: { tags: { select: { id: true } } },
  });

  if (pendingManual.length === 0) {
    if (ctx.type === "user") {
      await prisma.user.update({
        where: { id: ctx.userId },
        data: { lastProcessedDate: today },
      });
    } else {
      await prisma.guestSession.update({
        where: { id: ctx.guestSessionId },
        data: { lastProcessedDate: today },
      });
    }
    return { carriedOver: 0 };
  }

  // Atomic transaction: create carry-overs + mark sources as SKIPPED + update lastProcessedDate
  await prisma.$transaction(async (tx) => {
    for (const task of pendingManual) {
      await tx.dailyTask.create({
        data: {
          ...filter,
          sourceType: "MANUAL" as const,
          title: task.title,
          description: task.description,
          scheduledDate: today,
          originalDate: task.originalDate ?? task.scheduledDate,
          tags: { connect: task.tags.map((t) => ({ id: t.id })) },
        },
      });
    }
    await tx.dailyTask.updateMany({
      where: { id: { in: pendingManual.map((t) => t.id) } },
      data: { status: "SKIPPED" },
    });
    if (ctx.type === "user") {
      await tx.user.update({
        where: { id: ctx.userId },
        data: { lastProcessedDate: today },
      });
    } else {
      await tx.guestSession.update({
        where: { id: ctx.guestSessionId },
        data: { lastProcessedDate: today },
      });
    }
  });

  return { carriedOver: pendingManual.length };
}

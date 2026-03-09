import { prisma } from "@/lib/db/prisma";

export type RolloverResult = {
  carriedOver: number;
};

export async function processRollover(
  userId: string,
  lastProcessedDate: Date | null,
  today: Date,
): Promise<RolloverResult> {
  // Primeiro acesso: apenas marca o dia
  if (lastProcessedDate === null) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastProcessedDate: today },
    });
    return { carriedOver: 0 };
  }

  // Already processed today: no-op
  if (lastProcessedDate.getTime() >= today.getTime()) {
    return { carriedOver: 0 };
  }

  // Fetch pending manual tasks from the last processed date
  const pendingManual = await prisma.dailyTask.findMany({
    where: {
      userId,
      scheduledDate: lastProcessedDate,
      sourceType: "MANUAL",
      status: "PENDING",
    },
  });

  if (pendingManual.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastProcessedDate: today },
    });
    return { carriedOver: 0 };
  }

  // Build carry-overs preserving originalDate
  const carryOvers = pendingManual.map((task) => ({
    userId,
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
    prisma.user.update({
      where: { id: userId },
      data: { lastProcessedDate: today },
    }),
  ]);

  return { carriedOver: carryOvers.length };
}

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

  // Já processou hoje: no-op
  if (lastProcessedDate.getTime() >= today.getTime()) {
    return { carriedOver: 0 };
  }

  // Buscar tarefas manuais pendentes do último dia processado
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

  // Montar carry-overs preservando originalDate
  const carryOvers = pendingManual.map((task) => ({
    userId,
    sourceType: "MANUAL" as const,
    title: task.title,
    description: task.description,
    category: task.category,
    scheduledDate: today,
    originalDate: task.originalDate ?? task.scheduledDate,
  }));

  // Transação atômica: criar carry-overs + marcar fontes como SKIPPED + atualizar lastProcessedDate
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

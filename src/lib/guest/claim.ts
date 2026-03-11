import { prisma } from "@/lib/db/prisma";

export async function claimGuestData(
  guestSessionId: string,
  userId: string,
): Promise<{ claimedDailyTasks: number; claimedRecurringTasks: number }> {
  const result = await prisma.$transaction(async (tx) => {
    const dailyResult = await tx.dailyTask.updateMany({
      where: { guestSessionId },
      data: { userId, guestSessionId: null },
    });

    const recurringResult = await tx.recurringTask.updateMany({
      where: { guestSessionId },
      data: { userId, guestSessionId: null },
    });

    await tx.guestSession.delete({
      where: { id: guestSessionId },
    });

    return {
      claimedDailyTasks: dailyResult.count,
      claimedRecurringTasks: recurringResult.count,
    };
  });

  return result;
}

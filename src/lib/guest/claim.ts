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

    const guestTags = await tx.tag.findMany({ where: { guestSessionId } });
    const userTags = await tx.tag.findMany({ where: { userId } });
    const userTagsByName = new Map(userTags.map((t) => [t.name.toLowerCase(), t]));

    for (const guestTag of guestTags) {
      const existingUserTag = userTagsByName.get(guestTag.name.toLowerCase());

      if (existingUserTag) {
        await tx.$executeRaw`UPDATE "_DailyTaskToTag" SET "B" = ${existingUserTag.id} WHERE "B" = ${guestTag.id}`;
        await tx.$executeRaw`UPDATE "_RecurringTaskToTag" SET "B" = ${existingUserTag.id} WHERE "B" = ${guestTag.id}`;
        await tx.tag.delete({ where: { id: guestTag.id } });
      } else {
        await tx.tag.update({
          where: { id: guestTag.id },
          data: { guestSessionId: null, userId },
        });
      }
    }

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

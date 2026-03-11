import { prisma } from "@/lib/db/prisma";
import type { OwnerContext } from "@/lib/auth/owner-context";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { processRollover } from "@/lib/tasks/rollover";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";

type CronRolloverUserResult = {
  userId: string;
  carriedOver: number;
};

export type CronRolloverResult = {
  processed: number;
  results: CronRolloverUserResult[];
};

export async function processCronRollover(): Promise<CronRolloverResult> {
  const users = await prisma.user.findMany({
    select: { id: true, timezone: true, lastProcessedDate: true },
  });

  const results: CronRolloverUserResult[] = [];

  for (const user of users) {
    const today = getUserLocalDate(user.timezone);

    if (
      !user.lastProcessedDate ||
      user.lastProcessedDate.getTime() < today.getTime()
    ) {
      const ctx: OwnerContext = {
        type: "user",
        userId: user.id,
        timezone: user.timezone,
      };
      const rollover = await processRollover(
        ctx,
        user.lastProcessedDate,
        today,
      );
      await ensureRecurringInstances({ userId: user.id }, today);
      results.push({ userId: user.id, carriedOver: rollover.carriedOver });
    }
  }

  return { processed: results.length, results };
}

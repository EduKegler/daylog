import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getHistory } from "@/lib/history/queries";
import { NavMenu } from "@/app/components/nav-menu";
import { EmptyState } from "@/app/components/empty-state";
import { NoHistoryIllustration } from "@/app/components/empty-state-illustrations";
import { HistoryDayCard } from "./_components/history-day-card";

const link = "text-small text-muted transition-colors duration-200 hover:text-accent";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const pageSize = 7;

  const today = getUserLocalDate(user.timezone);
  const { days, hasMore } = await getHistory(user.id, today, page, pageSize);

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">history</h1>
          <p className="text-subtext text-muted mt-1 block">Previous days</p>
        </div>
        <NavMenu />
      </header>

      <div>
        {days.length === 0 ? (
          <EmptyState
            illustration={<NoHistoryIllustration />}
            title="No history yet"
            description="Your completed days will be recorded here."
          />
        ) : (
          days.map((day) => (
            <HistoryDayCard key={day.date.toISOString()} day={day} />
          ))
        )}

        <div className="flex justify-between mt-8 pt-4">
          {page > 0 && (
            <Link
              href={`/history?page=${page - 1}`}
              className={link}
            >
              ← Newer
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/history?page=${page + 1}`}
              className={link}
            >
              Older →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

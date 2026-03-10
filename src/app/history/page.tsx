import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getHistory } from "@/lib/history/queries";
import { HistoryDayCard } from "./_components/history-day-card";

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
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <h1 className="app-title">history</h1>
          <p className="today-date">Previous days</p>
        </div>
        <Link
          href="/"
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
        >
          ← Back
        </Link>
      </header>

      <div className="dashboard-content">
        {days.length === 0 ? (
          <p className="empty-message">No history found.</p>
        ) : (
          days.map((day) => (
            <HistoryDayCard key={day.date.toISOString()} day={day} />
          ))
        )}

        <div className="history-pagination">
          {page > 0 && (
            <Link
              href={`/history?page=${page - 1}`}
              className="pagination-link"
            >
              ← Newer
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/history?page=${page + 1}`}
              className="pagination-link"
            >
              Older →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

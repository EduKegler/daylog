"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useHistory } from "@/lib/queries/history";
import { EmptyState } from "@/app/components/empty-state";
import { NoHistoryIllustration } from "@/app/components/empty-state-illustrations";
import { HistoryDayCard } from "./history-day-card";

const link = "text-small text-muted transition-colors duration-200 hover:text-accent cursor-pointer";

function HistorySkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="mt-8 pb-6 border-b-2 border-border animate-pulse">
          <div className="flex items-baseline justify-between mb-3">
            <div className="h-5 w-32 rounded bg-border" />
            <div className="h-4 w-16 rounded bg-border" />
          </div>
          {Array.from({ length: 2 }, (_, j) => (
            <div key={j} className="py-2 flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-border" />
              <div className="h-4 w-2/3 rounded bg-border" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const { data, isLoading, isFetching } = useHistory(page);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 0) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    const query = params.toString();
    router.push(query ? `/history?${query}` : "/history");
  }

  if (isLoading || !data) {
    return <HistorySkeleton />;
  }

  if (data.days.length === 0 && page === 0) {
    return (
      <EmptyState
        illustration={<NoHistoryIllustration />}
        title="No history yet"
        description="Your completed days will be recorded here."
      />
    );
  }

  return (
    <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
      <div>
        {data.days.map((day) => (
          <HistoryDayCard key={day.date} day={day} />
        ))}
      </div>

      <div className="flex justify-between mt-8 pt-4">
        {page > 0 && (
          <button onClick={() => goToPage(page - 1)} className={link}>
            &larr; Newer
          </button>
        )}
        <div />
        {data.hasMore && (
          <button onClick={() => goToPage(page + 1)} className={link}>
            Older &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

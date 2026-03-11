"use client";

import { useUpcomingTasks } from "@/lib/queries/upcoming";
import { EmptyState } from "@/app/components/empty-state";
import { NoUpcomingIllustration } from "@/app/components/empty-state-illustrations";
import { UpcomingDayCard } from "./upcoming-day-card";

function UpcomingSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="mt-8 pb-6 border-b-2 border-border animate-pulse">
          <div className="flex items-baseline justify-between mb-3">
            <div className="h-5 w-28 rounded bg-border" />
          </div>
          {Array.from({ length: 2 }, (_, j) => (
            <div key={j} className="flex items-start gap-3 py-3.5 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-border shrink-0 mt-[7px]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function UpcomingContent() {
  const { data, isLoading } = useUpcomingTasks();

  if (isLoading || !data) {
    return <UpcomingSkeleton />;
  }

  if (data.days.length === 0) {
    return (
      <EmptyState
        illustration={<NoUpcomingIllustration />}
        title="No upcoming tasks"
        description="Tasks scheduled for future days will show up here."
      />
    );
  }

  return (
    <div>
      {data.days.map((day) => (
        <UpcomingDayCard
          key={day.date}
          day={day}
          todayISO={data.today}
        />
      ))}
    </div>
  );
}

import { cn } from "@/lib/cn";
import type { HistoryDay } from "@/lib/history/queries";
import { formatLongDate, formatShortDate } from "@/lib/dates/format";

const statusBase = "w-5 h-5 flex items-center justify-center shrink-0 text-small font-semibold";
const badge = "text-tag font-medium px-2 py-0.5 rounded-full bg-border text-muted whitespace-nowrap";
const badgeCarryOver = "text-tag font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap";

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <span className={`${statusBase} text-accent`}>✓</span>;
  }
  if (status === "SKIPPED") {
    return <span className={`${statusBase} text-amber-800`}>↗</span>;
  }
  return <span className={`${statusBase} text-muted`}>—</span>;
}

export function HistoryDayCard({ day }: { day: HistoryDay }) {
  const pct = Math.round(day.stats.completionRate * 100);

  return (
    <section className="mt-8 pb-6 border-b-2 border-border">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-heading text-stone-900 capitalize">{formatLongDate(day.date)}</h2>
        <span className="text-small text-muted font-medium">
          {day.stats.completed}/{day.stats.total} · {pct}%
        </span>
      </div>

      <div className="flex flex-col">
        {day.tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 py-2 border-b border-border">
            <StatusIcon status={task.status} />

            <div className="flex-1 min-w-0">
              <span
                className={cn("text-body leading-[1.4]", task.status === "COMPLETED" && "line-through opacity-50")}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {task.category && (
                <span className={badge}>{task.category}</span>
              )}
              {task.sourceType === "RECURRING" && (
                <span className={badge} title="Recurring">
                  ↻
                </span>
              )}
              {task.status === "SKIPPED" &&
                task.originalDate === null && (
                  <span
                    className={badgeCarryOver}
                    title="Carried over to the next day"
                  >
                    ↗
                  </span>
                )}
              {task.originalDate &&
                task.originalDate.getTime() !==
                  task.scheduledDate.getTime() && (
                  <span
                    className={badgeCarryOver}
                    title={`Originally on ${formatShortDate(task.originalDate)}`}
                  >
                    ↗ {formatShortDate(task.originalDate)}
                  </span>
                )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

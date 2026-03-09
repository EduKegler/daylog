import type { HistoryDay } from "@/lib/history/queries";
import { formatLongDate, formatShortDate } from "@/lib/dates/format";

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return <span className="history-status-icon completed">✓</span>;
  }
  if (status === "SKIPPED") {
    return <span className="history-status-icon skipped">↗</span>;
  }
  return <span className="history-status-icon pending">—</span>;
}

export function HistoryDayCard({ day }: { day: HistoryDay }) {
  const pct = Math.round(day.stats.completionRate * 100);

  return (
    <section className="history-day-card">
      <div className="history-day-header">
        <h2 className="history-day-title">{formatLongDate(day.date)}</h2>
        <span className="history-day-stats">
          {day.stats.completed}/{day.stats.total} · {pct}%
        </span>
      </div>

      <div className="task-list">
        {day.tasks.map((task) => (
          <div key={task.id} className="task-item history-task-item">
            <StatusIcon status={task.status} />

            <div className="flex-1 min-w-0">
              <span
                className={`task-title ${task.status === "COMPLETED" ? "line-through opacity-50" : ""}`}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {task.category && (
                <span className="task-badge">{task.category}</span>
              )}
              {task.sourceType === "RECURRING" && (
                <span className="task-badge recurring" title="Recurring">
                  ↻
                </span>
              )}
              {task.status === "SKIPPED" &&
                task.originalDate === null && (
                  <span
                    className="task-badge carryover"
                    title="Carried over to the next day"
                  >
                    ↗
                  </span>
                )}
              {task.originalDate &&
                task.originalDate.getTime() !==
                  task.scheduledDate.getTime() && (
                  <span
                    className="task-badge carryover"
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

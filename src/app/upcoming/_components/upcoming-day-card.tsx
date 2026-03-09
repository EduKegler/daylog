import type { UpcomingDay } from "@/lib/upcoming/queries";
import { formatLongDate } from "@/lib/dates/format";
import { formatRelativeDate } from "@/lib/dates/relative";

export function UpcomingDayCard({
  day,
  today,
}: {
  day: UpcomingDay;
  today: Date;
}) {
  const relative = formatRelativeDate(day.date, today);

  return (
    <section className="upcoming-day-card">
      <div className="upcoming-day-header">
        <div>
          <h2 className="history-day-title">{formatLongDate(day.date)}</h2>
          <span className="upcoming-relative">{relative}</span>
        </div>
        <span className="history-day-stats">
          {day.tasks.length} {day.tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="task-list">
        {day.tasks.map((task) => (
          <div key={task.id} className="task-item history-task-item">
            <span className="upcoming-dot" />

            <div className="flex-1 min-w-0">
              <span className="task-title">{task.title}</span>
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { UpcomingDay } from "@/lib/upcoming/queries";
import { formatLongDate } from "@/lib/dates/format";
import { formatRelativeDate } from "@/lib/dates/relative";
import { TaskItem, type Task } from "@/app/components/task-item";

function serializeTask(t: UpcomingDay["tasks"][number]): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    sourceType: t.sourceType as Task["sourceType"],
    status: t.status as Task["status"],
    originalDate: t.originalDate?.toISOString() ?? null,
    scheduledDate: t.scheduledDate.toISOString(),
  };
}

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
          <TaskItem key={task.id} task={serializeTask(task)} />
        ))}
      </div>
    </section>
  );
}

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
    <section className="mt-8 pb-6 border-b-2 border-border">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="font-display text-heading text-stone-900 capitalize">{formatLongDate(day.date)}</h2>
          <span className="text-small text-accent font-medium mt-0.5 block">{relative}</span>
        </div>
        <span className="text-small text-muted font-medium">
          {day.tasks.length} {day.tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="flex flex-col">
        {day.tasks.map((task) => (
          <TaskItem key={task.id} task={serializeTask(task)} />
        ))}
      </div>
    </section>
  );
}

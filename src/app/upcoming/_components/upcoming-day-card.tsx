import type { UpcomingDay } from "@/lib/queries/upcoming";
import { formatLongDate } from "@/lib/dates/format";
import { formatRelativeDate } from "@/lib/dates/relative";
import { TaskItem } from "@/app/components/task-item";

export function UpcomingDayCard({
  day,
  todayISO,
}: {
  day: UpcomingDay;
  todayISO: string;
}) {
  const date = new Date(day.date);
  const today = new Date(todayISO);
  const relative = formatRelativeDate(date, today);

  return (
    <section className="mt-8 pb-6 border-b-2 border-border">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="font-display text-heading text-stone-900 capitalize">{formatLongDate(date)}</h2>
          <span className="text-small text-accent font-medium mt-0.5 block">{relative}</span>
        </div>
        <span className="text-small text-muted font-medium">
          {day.tasks.length} {day.tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="flex flex-col">
        {day.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

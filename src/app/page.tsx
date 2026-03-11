import { DaylogIcon } from "./components/daylog-icon";
import { getCurrentUser } from "@/lib/auth/session";
import { getDailyTasksForDate } from "@/lib/tasks/queries";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { computeDayStats } from "@/lib/stats/day-stats";
import { formatLongDate } from "@/lib/dates/format";
import { NavMenu } from "./components/nav-menu";
import { DaySummary } from "./components/day-summary";
import { TaskList } from "./components/task-list";
import { CreateTaskForm } from "./components/create-task-form";
import { EmptyState } from "./components/empty-state";
import { AllClearIllustration, NoCompletedIllustration } from "./components/empty-state-illustrations";
import type { Task } from "./components/task-item";

function serializeTask(t: {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sourceType: string;
  status: string;
  originalDate: Date | null;
  scheduledDate: Date;
}): Task {
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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);

  await ensureRecurringInstances(user.id, today);
  const tasks = await getDailyTasksForDate(user.id, today);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const stats = computeDayStats(tasks);

  const serializedPending = pending.map(serializeTask);
  const serializedCompleted = completed.map(serializeTask);

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <DaylogIcon size={28} />
            <h1 className="font-display text-display text-stone-900 leading-none capitalize">daylog</h1>
          </div>
          <time className="text-subtext text-muted mt-1 block" dateTime={today.toISOString()}>
            {formatLongDate(today)}
          </time>
        </div>
        <NavMenu />
      </header>

      <DaySummary stats={stats} />

      <div>
        <TaskList
          title="Pending"
          tasks={serializedPending}
          emptyMessage={
            <EmptyState
              illustration={<AllClearIllustration />}
              title="All clear!"
              description="You've completed all your tasks for today."
            />
          }
        />

        <CreateTaskForm />

        <TaskList
          title="Completed"
          tasks={serializedCompleted}
          emptyMessage={
            <EmptyState
              illustration={<NoCompletedIllustration />}
              title="Nothing completed yet"
              description="Completed tasks will appear here as you check them off."
            />
          }
        />
      </div>
    </main>
  );
}

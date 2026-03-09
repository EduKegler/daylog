import Link from "next/link";
import { DaylogIcon } from "./components/daylog-icon";
import { getCurrentUser } from "@/lib/auth/session";
import { getDailyTasksForDate, getUserDayState } from "@/lib/tasks/queries";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { processRollover } from "@/lib/tasks/rollover";
import { computeDayStats } from "@/lib/stats/day-stats";
import { formatLongDate } from "@/lib/dates/format";
import { signOut } from "@/lib/auth";
import { DaySummary } from "./components/day-summary";
import { TaskList } from "./components/task-list";
import { CreateTaskForm } from "./components/create-task-form";
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
  const { timezone, lastProcessedDate } = await getUserDayState(user.id);
  const today = getUserLocalDate(timezone);

  // Rollover + recurring in parallel (independent operations)
  const needsRollover =
    !lastProcessedDate || lastProcessedDate.getTime() < today.getTime();

  await Promise.all([
    needsRollover
      ? processRollover(user.id, lastProcessedDate, today)
      : undefined,
    ensureRecurringInstances(user.id, today),
  ]);

  const tasks = await getDailyTasksForDate(user.id, today);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const stats = computeDayStats(tasks);

  const serializedPending = pending.map(serializeTask);
  const serializedCompleted = completed.map(serializeTask);

  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DaylogIcon size={28} />
            <h1 className="app-title">daylog</h1>
          </div>
          <time className="today-date" dateTime={today.toISOString()}>
            {formatLongDate(today)}
          </time>
        </div>
        <div className="flex items-baseline gap-4">
          <Link
            href="/history"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            History
          </Link>
          <Link
            href="/upcoming"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            Upcoming
          </Link>
          <Link
            href="/recurring"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            Recurring
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-[var(--color-muted)] hover:text-stone-600 transition-colors duration-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <DaySummary stats={stats} />

      <div className="dashboard-content">
        <TaskList
          title="Pending"
          tasks={serializedPending}
          emptyMessage="No pending tasks. Good job!"
        />

        <CreateTaskForm />

        <TaskList
          title="Completed"
          tasks={serializedCompleted}
          emptyMessage="No completed tasks yet."
        />
      </div>
    </main>
  );
}

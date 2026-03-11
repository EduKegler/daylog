import Link from "next/link";
import { DaylogIcon } from "./components/daylog-icon";
import { getCurrentUser } from "@/lib/auth/session";
import { getDailyTasksForDate } from "@/lib/tasks/queries";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { getUserLocalDate } from "@/lib/tasks/generation";
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
  const today = getUserLocalDate(user.timezone);

  await ensureRecurringInstances(user.id, today);
  const tasks = await getDailyTasksForDate(user.id, today);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const stats = computeDayStats(tasks);

  const serializedPending = pending.map(serializeTask);
  const serializedCompleted = completed.map(serializeTask);

  return (
    <main className="dashboard">
      <header className="dashboard-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <DaylogIcon size={28} />
            <h1 className="app-title">daylog</h1>
          </div>
          <time className="today-date" dateTime={today.toISOString()}>
            {formatLongDate(today)}
          </time>
        </div>
        <nav className="flex items-baseline gap-3 sm:gap-4">
          <Link
            href="/history"
            className="text-small text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            History
          </Link>
          <Link
            href="/upcoming"
            className="text-small text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            Upcoming
          </Link>
          <Link
            href="/recurring"
            className="text-small text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
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
              className="text-small text-[var(--color-muted)] hover:text-stone-600 transition-colors duration-200"
            >
              Sign out
            </button>
          </form>
        </nav>
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

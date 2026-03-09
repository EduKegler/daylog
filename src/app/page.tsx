import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDailyTasksForDate } from "@/lib/tasks/queries";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";
import { computeDayStats } from "@/lib/stats/day-stats";
import { signOut } from "@/lib/auth";
import { DaySummary } from "./components/day-summary";
import { TaskList } from "./components/task-list";
import { CreateTaskForm } from "./components/create-task-form";

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const today = new Date();

  await ensureRecurringInstances(user.id, today);
  const tasks = await getDailyTasksForDate(user.id, today);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const stats = computeDayStats(tasks);

  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <h1 className="app-title">daylog</h1>
          <time className="today-date" dateTime={today.toISOString()}>
            {formatDate(today)}
          </time>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/recurring"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            Recorrentes
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
              Sair
            </button>
          </form>
        </div>
      </header>

      <DaySummary stats={stats} />

      <div className="dashboard-content">
        <TaskList
          title="Pendentes"
          tasks={pending}
          emptyMessage="Nenhuma tarefa pendente. Bom trabalho!"
        />

        <CreateTaskForm />

        <TaskList
          title="Concluídas"
          tasks={completed}
          emptyMessage="Nenhuma tarefa concluída ainda."
        />
      </div>
    </main>
  );
}

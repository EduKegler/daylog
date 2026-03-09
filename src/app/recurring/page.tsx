import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getRecurringTasks } from "@/lib/tasks/queries";
import { RecurringTaskList } from "./_components/recurring-task-list";
import { RecurringTaskForm } from "./_components/recurring-task-form";

export default async function RecurringPage() {
  const user = await getCurrentUser();
  const tasks = await getRecurringTasks(user.id!);

  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <h1 className="app-title">recurring</h1>
          <p className="today-date">Tasks that repeat automatically</p>
        </div>
        <Link
          href="/"
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
        >
          ← Back
        </Link>
      </header>

      <RecurringTaskForm />

      <RecurringTaskList tasks={JSON.parse(JSON.stringify(tasks))} />
    </main>
  );
}

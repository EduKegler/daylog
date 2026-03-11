import { getCurrentUser } from "@/lib/auth/session";
import { getRecurringTasks } from "@/lib/tasks/queries";
import { NavMenu } from "@/app/components/nav-menu";
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
        <NavMenu />
      </header>

      <RecurringTaskForm />

      <RecurringTaskList
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          recurrenceType: t.recurrenceType,
          recurrenceConfig: t.recurrenceConfig,
          isActive: t.isActive,
        }))}
      />
    </main>
  );
}

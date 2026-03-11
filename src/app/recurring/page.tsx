import { getCurrentUser } from "@/lib/auth/session";
import { getRecurringTasks } from "@/lib/tasks/queries";
import { NavMenu } from "@/app/components/nav-menu";
import { RecurringTaskList } from "./_components/recurring-task-list";
import { RecurringTaskForm } from "./_components/recurring-task-form";

export default async function RecurringPage() {
  const user = await getCurrentUser();
  const tasks = await getRecurringTasks(user.id!);

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">recurring</h1>
          <p className="text-subtext text-muted mt-1 block">Tasks that repeat automatically</p>
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

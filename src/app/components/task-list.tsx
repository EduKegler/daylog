import { TaskItem, type Task } from "./task-item";

export function TaskList({
  title,
  tasks,
  emptyMessage,
}: {
  title: string;
  tasks: Task[];
  emptyMessage: React.ReactNode;
}) {
  if (tasks.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-small font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">{title}</h2>
        <div>{emptyMessage}</div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-small font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
        {title}
        <span className="text-tag font-medium text-muted bg-border px-2 py-0.5 rounded-full">{tasks.length}</span>
      </h2>
      <div className="flex flex-col">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

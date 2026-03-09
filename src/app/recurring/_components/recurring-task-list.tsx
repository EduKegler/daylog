"use client";

import { useTransition } from "react";
import { toggleRecurringTask, deleteRecurringTask } from "@/lib/tasks/actions";
import {
  parseRecurrenceConfig,
  getRecurrenceLabel,
} from "@/lib/tasks/recurrence";

type RecurringTask = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  recurrenceType: string;
  recurrenceConfig: string | null;
  isActive: boolean;
};

export function RecurringTaskList({ tasks }: { tasks: RecurringTask[] }) {
  if (tasks.length === 0) {
    return <p className="empty-message">No recurring tasks yet.</p>;
  }

  return (
    <div className="task-list mt-6">
      {tasks.map((task) => (
        <RecurringTaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

function RecurringTaskItem({ task }: { task: RecurringTask }) {
  const [isPending, startTransition] = useTransition();

  const config = (() => {
    try {
      return parseRecurrenceConfig(
        task.recurrenceType as Parameters<typeof parseRecurrenceConfig>[0],
        task.recurrenceConfig,
      );
    } catch {
      return null;
    }
  })();

  const label = getRecurrenceLabel(
    task.recurrenceType as Parameters<typeof getRecurrenceLabel>[0],
    config,
  );

  function handleToggle() {
    startTransition(async () => {
      await toggleRecurringTask(task.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRecurringTask(task.id);
    });
  }

  return (
    <div
      className={`task-item group ${!task.isActive ? "opacity-50" : ""} ${isPending ? "opacity-30" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="task-title">{task.title}</span>
          {task.category && (
            <span className="task-badge">{task.category}</span>
          )}
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <p className="text-xs text-[var(--color-muted)] mt-1">{label}</p>
      </div>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
          task.isActive
            ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
            : "bg-[var(--color-border)] text-[var(--color-muted)] hover:bg-stone-300"
        }`}
      >
        {task.isActive ? "Active" : "Inactive"}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-[var(--color-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm"
        aria-label="Delete recurring task"
      >
        ×
      </button>
    </div>
  );
}

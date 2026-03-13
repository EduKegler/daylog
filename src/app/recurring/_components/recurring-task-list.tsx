"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { RecurringTask } from "@/lib/queries/recurring";
import {
  useToggleRecurringTask,
  useDeleteRecurringTask,
} from "@/lib/queries/recurring";
import {
  parseRecurrenceConfig,
  getRecurrenceLabel,
} from "@/lib/tasks/recurrence";
import { Text } from "@/app/components/text";
import { EmptyState } from "@/app/components/empty-state";
import { NoRecurringIllustration } from "@/app/components/empty-state-illustrations";
import { TaskForm } from "@/app/components/task-form/task-form";
import { TagBadge } from "@/app/components/tag-badge";

const taskItemBase = "flex items-start gap-3 py-3.5 border-b border-border transition-transform duration-200 hover:translate-x-0.5";
const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md text-border bg-transparent border-none transition-all duration-200 shrink-0 group-hover:text-muted";
const actionBtnEdit = `${actionBtn} hover:text-muted hover:bg-border`;
const actionBtnDelete = `${actionBtn} hover:text-red-600 hover:bg-red-50`;

export function RecurringTaskList({ tasks }: { tasks: RecurringTask[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        illustration={<NoRecurringIllustration />}
        title="No recurring tasks"
        description="Create tasks that repeat daily, on weekdays, or on specific days."
      />
    );
  }

  return (
    <div className="flex flex-col mt-6">
      {tasks.map((task) => (
        <RecurringTaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

function RecurringTaskItem({ task }: { task: RecurringTask }) {
  const toggleTask = useToggleRecurringTask();
  const deleteTask = useDeleteRecurringTask();
  const [isEditing, setIsEditing] = useState(false);

  const isPending = toggleTask.isPending || deleteTask.isPending;

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
    toggleTask.mutate(task.id);
  }

  function handleDelete() {
    deleteTask.mutate(task.id);
  }

  if (isEditing) {
    return (
      <TaskForm
        mode="edit"
        taskType="recurring"
        taskId={task.id}
        initialData={{
          title: task.title,
          description: task.description,
          tags: task.tags,
          recurrenceType: task.recurrenceType,
          recurrenceConfig: task.recurrenceConfig,
        }}
        onSuccess={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(taskItemBase, "group", !task.isActive && "opacity-50", isPending && "opacity-30")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span
            className="text-body leading-[1.4] flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setIsEditing(true)} disabled={isPending} className={actionBtnEdit} data-action-btn aria-label="Edit recurring task">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 2.5L11.5 5.5M1.5 12.5L2.25 9.75L10 2C10.83 1.17 12.17 1.17 13 2C13.83 2.83 13.83 4.17 13 5L5.25 12.75L1.5 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={cn(
                "px-3 py-1 text-small font-medium rounded-full transition-colors duration-200",
                task.isActive
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-border text-muted hover:bg-stone-300",
              )}
            >
              {task.isActive ? "Active" : "Inactive"}
            </button>
            <button onClick={handleDelete} disabled={isPending} className={actionBtnDelete} data-action-btn aria-label="Delete recurring task">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {task.description && (
          <Text variant="small" muted className="mt-0.5">{task.description}</Text>
        )}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {task.tags.map(tag => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        )}
        <Text variant="small" muted className="mt-1">{label}</Text>
      </div>
    </div>
  );
}

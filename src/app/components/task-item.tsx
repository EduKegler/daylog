"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates/format";
import { canEditDailyTask } from "@/lib/tasks/daily-task-rules";
import { Text } from "./text";
import {
  useCompleteTask,
  useUncompleteTask,
  useDeleteTask,
} from "@/lib/queries/daily";
import { TaskForm } from "./task-form/task-form";
import { Tooltip } from "./tooltip";
import { TagBadge } from "./tag-badge";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  sourceType: "MANUAL" | "RECURRING";
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  originalDate: string | null;
  scheduledDate: string;
  recurringTaskId: string | null;
  recurrenceType: string | null;
  recurrenceConfig: string | null;
};

const taskItemBase = "flex items-start gap-3 py-3.5 border-b border-border transition-transform duration-200 hover:translate-x-0.5";
const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md text-border bg-transparent border-none transition-all duration-200 shrink-0 group-hover:text-muted";
const actionBtnEdit = `${actionBtn} hover:text-muted hover:bg-border`;
const actionBtnDelete = `${actionBtn} hover:text-red-600 hover:bg-red-50`;
const badge = "text-tag font-medium px-2 py-0.5 rounded-full bg-border text-muted whitespace-nowrap";
const badgeCarryOver = "text-tag font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap";

export function TaskItem({ task }: { task: Task }) {
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const deleteTask = useDeleteTask();

  const [isEditing, setIsEditing] = useState(false);
  const isCompleted = task.status === "COMPLETED";
  const isCarryOver =
    task.originalDate && task.originalDate !== task.scheduledDate;
  const isPending =
    completeTask.isPending || uncompleteTask.isPending || deleteTask.isPending;
  const canEdit = canEditDailyTask(task);

  function handleToggle() {
    if (isCompleted) {
      uncompleteTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
  }

  function handleDelete() {
    deleteTask.mutate(task.id);
  }

  function handleEdit() {
    if (!canEdit) return;
    setIsEditing(true);
  }

  if (isEditing) {
    const { recurringTaskId, recurrenceType } = task;
    const isRecurring =
      task.sourceType === "RECURRING" &&
      recurringTaskId !== null &&
      recurrenceType !== null;

    return (
      <div className={taskItemBase}>
        <div className="flex-1 min-w-0">
          {isRecurring ? (
            <TaskForm
              mode="edit"
              taskType="recurring"
              taskId={recurringTaskId}
              initialData={{
                title: task.title,
                description: task.description,
                tags: task.tags,
                recurrenceType: recurrenceType,
                recurrenceConfig: task.recurrenceConfig,
              }}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <TaskForm
              mode="edit"
              taskType="one-time"
              taskId={task.id}
              initialData={{
                title: task.title,
                description: task.description,
                tags: task.tags,
                scheduledDate: task.scheduledDate,
              }}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(taskItemBase, "group", isCompleted && "opacity-60", isPending && "opacity-50")}
    >
      <Tooltip content={isCompleted ? "Undo completion" : "Complete task"}>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "w-5 h-5 rounded-full border-2 border-border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 bg-transparent hover:border-accent",
            isCompleted && "border-accent bg-accent text-white",
          )}
          aria-label={isCompleted ? "Uncheck task" : "Complete task"}
        >
          {isCompleted && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="w-3 h-3"
            >
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </Tooltip>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span
            className={cn("text-body leading-[1.4] flex-1 min-w-0", isCompleted ? "line-through opacity-50" : canEdit ? "cursor-pointer" : "")}
            onClick={canEdit ? handleEdit : undefined}
          >
            {task.title}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {canEdit && (
              <Tooltip content="Edit task">
                <button onClick={handleEdit} disabled={isPending} className={actionBtnEdit} data-action-btn aria-label="Edit task">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M8.5 2.5L11.5 5.5M1.5 12.5L2.25 9.75L10 2C10.83 1.17 12.17 1.17 13 2C13.83 2.83 13.83 4.17 13 5L5.25 12.75L1.5 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </Tooltip>
            )}
            <Tooltip content="Delete task">
              <button onClick={handleDelete} disabled={isPending} className={actionBtnDelete} data-action-btn aria-label="Delete task">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
        {task.description && (
          <Text variant="small" muted className="mt-0.5">{task.description}</Text>
        )}
        {(isCarryOver || task.tags.length > 0 || task.sourceType === "RECURRING") && (
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {isCarryOver && task.originalDate && (
              <Tooltip content={`Carried over from ${formatShortDate(task.originalDate)}`}>
                <span className={badgeCarryOver} tabIndex={0}>
                  ↗ {formatShortDate(task.originalDate)}
                </span>
              </Tooltip>
            )}
            {task.tags.map(tag => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
            {task.sourceType === "RECURRING" && (
              <Tooltip content="Recurring task">
                <span className={badge} tabIndex={0}>↻</span>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

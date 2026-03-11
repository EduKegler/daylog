"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates/format";
import {
  useCompleteTask,
  useUncompleteTask,
  useDeleteTask,
  useUpdateTask,
} from "@/lib/queries/daily";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sourceType: "MANUAL" | "RECURRING";
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  originalDate: string | null;
  scheduledDate: string;
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
  const updateTask = useUpdateTask();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const isCompleted = task.status === "COMPLETED";
  const isCarryOver =
    task.originalDate && task.originalDate !== task.scheduledDate;
  const isPending =
    completeTask.isPending || uncompleteTask.isPending || deleteTask.isPending || updateTask.isPending;

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
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditCategory(task.category ?? "");
    setIsEditing(true);
  }

  function handleSave() {
    if (!editTitle.trim()) return;
    updateTask.mutate(
      {
        taskId: task.id,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory.trim() || null,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (isEditing) {
    return (
      <div className={taskItemBase}>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full py-2 text-body bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Category (optional)"
              className="w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !editTitle.trim()}
              className="text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(taskItemBase, "group", isCompleted && "opacity-60", isPending && "opacity-50")}
    >
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

      <div className="flex-1 min-w-0">
        <span
          className={cn("text-body leading-[1.4]", isCompleted ? "line-through opacity-50" : "cursor-pointer")}
          onClick={!isCompleted ? handleEdit : undefined}
        >
          {task.title}
        </span>
        {task.description && (
          <p className="text-small text-muted mt-0.5">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isCarryOver && (
          <span
            className={badgeCarryOver}
            title={`Originally on ${formatShortDate(task.originalDate!)}`}
          >
            ↗ {formatShortDate(task.originalDate!)}
          </span>
        )}
        {task.category && <span className={badge}>{task.category}</span>}
        {task.sourceType === "RECURRING" && (
          <span className={badge} title="Recurring task">↻</span>
        )}
        <div className="flex items-center gap-0.5">
          {!isCompleted && (
            <button onClick={handleEdit} disabled={isPending} className={actionBtnEdit} data-action-btn aria-label="Edit task">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 2.5L11.5 5.5M1.5 12.5L2.25 9.75L10 2C10.83 1.17 12.17 1.17 13 2C13.83 2.83 13.83 4.17 13 5L5.25 12.75L1.5 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <button onClick={handleDelete} disabled={isPending} className={actionBtnDelete} data-action-btn aria-label="Delete task">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

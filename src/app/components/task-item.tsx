"use client";

import { useState, useTransition } from "react";
import { formatShortDate } from "@/lib/dates/format";
import {
  completeTaskAction,
  uncompleteTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "../actions";

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

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const isCompleted = task.status === "COMPLETED";
  const isCarryOver =
    task.originalDate && task.originalDate !== task.scheduledDate;

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteTaskAction(task.id);
      } else {
        await completeTaskAction(task.id);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTaskAction(task.id);
    });
  }

  function handleEdit() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditCategory(task.category ?? "");
    setIsEditing(true);
  }

  function handleSave() {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateTaskAction(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
      });
      setIsEditing(false);
    });
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
      <div className="task-item">
        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="task-input"
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <div className="form-row">
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="task-input small"
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Category (optional)"
              className="task-input small"
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !editTitle.trim()}
              className="btn-submit"
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
      className={`task-item group ${isCompleted ? "completed" : ""} ${isPending ? "opacity-50" : ""}`}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="checkbox-btn"
        aria-label={isCompleted ? "Uncheck task" : "Complete task"}
      >
        {isCompleted && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="check-icon"
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
          className={`task-title ${isCompleted ? "line-through opacity-50" : "cursor-pointer hover:text-[var(--color-accent)]"}`}
          onClick={!isCompleted ? handleEdit : undefined}
          title={!isCompleted ? "Click to edit" : undefined}
        >
          {task.title}
        </span>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isCarryOver && (
          <span
            className="task-badge carryover"
            title={`Originally on ${formatShortDate(task.originalDate!)}`}
          >
            ↗ {formatShortDate(task.originalDate!)}
          </span>
        )}
        {task.category && <span className="task-badge">{task.category}</span>}
        {task.sourceType === "RECURRING" && (
          <span className="task-badge recurring" title="Recurring task">↻</span>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[var(--color-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>
    </div>
  );
}

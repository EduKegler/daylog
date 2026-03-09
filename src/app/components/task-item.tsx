"use client";

import { useTransition } from "react";
import { completeTaskAction, uncompleteTaskAction } from "../actions";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sourceType: string;
  status: string;
};

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = task.status === "COMPLETED";

  function handleToggle() {
    startTransition(async () => {
      if (isCompleted) {
        await uncompleteTaskAction(task.id);
      } else {
        await completeTaskAction(task.id);
      }
    });
  }

  return (
    <div
      className={`task-item group ${isCompleted ? "completed" : ""} ${isPending ? "opacity-50" : ""}`}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="checkbox-btn"
        aria-label={isCompleted ? "Desmarcar tarefa" : "Concluir tarefa"}
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
        <span className={`task-title ${isCompleted ? "line-through opacity-50" : ""}`}>
          {task.title}
        </span>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {task.category && <span className="task-badge">{task.category}</span>}
        {task.sourceType === "RECURRING" && (
          <span className="task-badge recurring" title="Tarefa recorrente">↻</span>
        )}
      </div>
    </div>
  );
}

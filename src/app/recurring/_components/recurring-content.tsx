"use client";

import { useState } from "react";
import { useRecurringTasks } from "@/lib/queries/recurring";
import { TaskForm } from "@/app/components/task-form/task-form";
import { RecurringTaskList } from "./recurring-task-list";

function RecurringSkeleton() {
  return (
    <div className="flex flex-col mt-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-border" />
            <div className="h-3 w-1/4 rounded bg-border" />
          </div>
          <div className="h-6 w-14 rounded-full bg-border" />
        </div>
      ))}
    </div>
  );
}

function NewRecurringTaskButton() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full py-3.5 text-subtext text-muted bg-transparent border-0 border-b border-border transition-colors duration-200 hover:text-accent"
      >
        <span className="text-icon leading-none">+</span>
        New recurring task
      </button>
    );
  }

  return (
    <TaskForm
      mode="create"
      defaultTaskType="recurring"
      onSuccess={() => setIsOpen(false)}
      onCancel={() => setIsOpen(false)}
    />
  );
}

export function RecurringContent() {
  const { data, isLoading } = useRecurringTasks();

  return (
    <>
      <NewRecurringTaskButton />

      {isLoading || !data ? (
        <RecurringSkeleton />
      ) : (
        <RecurringTaskList tasks={data} />
      )}
    </>
  );
}

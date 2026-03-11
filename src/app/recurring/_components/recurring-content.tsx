"use client";

import { useRecurringTasks } from "@/lib/queries/recurring";
import { RecurringTaskForm } from "./recurring-task-form";
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

export function RecurringContent() {
  const { data, isLoading } = useRecurringTasks();

  return (
    <>
      <RecurringTaskForm />

      {isLoading || !data ? (
        <RecurringSkeleton />
      ) : (
        <RecurringTaskList tasks={data} />
      )}
    </>
  );
}

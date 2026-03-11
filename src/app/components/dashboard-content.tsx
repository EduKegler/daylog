"use client";

import { useState } from "react";
import { useDailyTasks } from "@/lib/queries/daily";
import { computeDayStats } from "@/lib/stats/day-stats";
import { DaySummary } from "./day-summary";
import { TaskList } from "./task-list";
import { TaskForm } from "./task-form/task-form";
import { EmptyState } from "./empty-state";
import { AllClearIllustration, NoCompletedIllustration } from "./empty-state-illustrations";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="bg-white border border-border rounded-xl p-4 flex flex-col items-center justify-center h-20 animate-pulse"
          >
            <div className="h-8 w-8 rounded bg-border" />
            <div className="h-3 w-14 rounded bg-border mt-2" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="h-4 w-16 rounded bg-border animate-pulse mb-3" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-border shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function NewTaskButton() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full py-3.5 text-subtext text-muted bg-transparent border-0 border-b border-border transition-colors duration-200 hover:text-accent"
      >
        <span className="text-icon leading-none">+</span>
        New task
      </button>
    );
  }

  return (
    <TaskForm
      mode="create"
      defaultTaskType="one-time"
      onSuccess={() => setIsOpen(false)}
      onCancel={() => setIsOpen(false)}
    />
  );
}

export function DashboardContent() {
  const { data, isLoading } = useDailyTasks();

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const pending = data.tasks.filter((t) => t.status === "PENDING");
  const completed = data.tasks.filter((t) => t.status === "COMPLETED");
  const stats = computeDayStats(data.tasks);

  return (
    <>
      <DaySummary stats={stats} />

      <div>
        <TaskList
          title="Pending"
          tasks={pending}
          emptyMessage={
            <EmptyState
              illustration={<AllClearIllustration />}
              title="All clear!"
              description="You've completed all your tasks for today."
            />
          }
        />

        <NewTaskButton />

        <TaskList
          title="Completed"
          tasks={completed}
          emptyMessage={
            <EmptyState
              illustration={<NoCompletedIllustration />}
              title="Nothing completed yet"
              description="Completed tasks will appear here as you check them off."
            />
          }
        />
      </div>
    </>
  );
}

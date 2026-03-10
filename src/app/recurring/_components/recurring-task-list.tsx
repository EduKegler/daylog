"use client";

import { useState, useTransition } from "react";
import {
  toggleRecurringTask,
  deleteRecurringTask,
  updateRecurringTask,
  type ActionResult,
} from "@/lib/tasks/actions";
import {
  parseRecurrenceConfig,
  getRecurrenceLabel,
} from "@/lib/tasks/recurrence";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

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
  const [isEditing, setIsEditing] = useState(false);

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

  if (isEditing) {
    return (
      <RecurringTaskEditForm
        task={task}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className={`task-item group ${!task.isActive ? "opacity-50" : ""} ${isPending ? "opacity-30" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="task-title cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
          {task.category && (
            <span className="task-badge">{task.category}</span>
          )}
        </div>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <p className="text-xs text-[var(--color-muted)] mt-1">{label}</p>
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={() => setIsEditing(true)} disabled={isPending} className="task-action-btn" aria-label="Edit recurring task">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 2.5L11.5 5.5M1.5 12.5L2.25 9.75L10 2C10.83 1.17 12.17 1.17 13 2C13.83 2.83 13.83 4.17 13 5L5.25 12.75L1.5 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
        <button onClick={handleDelete} disabled={isPending} className="task-action-btn delete" aria-label="Delete recurring task">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RecurringTaskEditForm({
  task,
  onCancel,
  onSaved,
}: {
  task: RecurringTask;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [recurrenceType, setRecurrenceType] = useState(task.recurrenceType);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedConfig = (() => {
    try {
      return task.recurrenceConfig ? JSON.parse(task.recurrenceConfig) : null;
    } catch {
      return null;
    }
  })();

  const [selectedDays, setSelectedDays] = useState<number[]>(
    parsedConfig?.days ?? [],
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    parsedConfig?.dayOfMonth ?? 1,
  );

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function buildConfig(): string | null {
    if (recurrenceType === "SPECIFIC_WEEKDAYS") {
      return JSON.stringify({ days: selectedDays });
    }
    if (recurrenceType === "MONTHLY") {
      return JSON.stringify({ dayOfMonth });
    }
    return null;
  }

  function handleSubmit(formData: FormData) {
    const config = buildConfig();
    if (config) {
      formData.set("recurrenceConfig", config);
    }
    formData.set("recurrenceType", recurrenceType);

    startTransition(async () => {
      const result: ActionResult = await updateRecurringTask(task.id, formData);
      if (result.success) {
        setErrors({});
        onSaved();
      } else if (result.errors) {
        setErrors(result.errors);
      }
    });
  }

  return (
    <form action={handleSubmit} className="create-task-form">
      <div>
        <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
          Title
        </label>
        <input
          name="title"
          type="text"
          defaultValue={task.title}
          required
          autoFocus
          className="task-input"
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
          Description (optional)
        </label>
        <input
          name="description"
          type="text"
          defaultValue={task.description ?? ""}
          placeholder="Additional details"
          className="task-input"
        />
      </div>

      <div className="form-row">
        <div className="flex-1">
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Category
          </label>
          <input
            name="category"
            type="text"
            defaultValue={task.category ?? ""}
            placeholder="Optional"
            className="task-input small"
          />
        </div>

        <div className="flex-1">
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Recurrence
          </label>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
            className="task-input small"
          >
            <option value="DAILY">Every day</option>
            <option value="WEEKDAYS">Weekdays</option>
            <option value="SPECIFIC_WEEKDAYS">Specific days</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          {errors.recurrenceType && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceType}</p>
          )}
        </div>
      </div>

      {recurrenceType === "SPECIFIC_WEEKDAYS" && (
        <div>
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium mb-2 block">
            Days of the week
          </label>
          <div className="flex gap-1">
            {WEEKDAYS.map((wd) => (
              <button
                key={wd.value}
                type="button"
                onClick={() => toggleDay(wd.value)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors duration-200 ${
                  selectedDays.includes(wd.value)
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-border)] text-[var(--color-muted)] hover:bg-stone-300"
                }`}
              >
                {wd.label}
              </button>
            ))}
          </div>
          {errors.recurrenceConfig && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      {recurrenceType === "MONTHLY" && (
        <div>
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Day of the month
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="task-input small"
            style={{ maxWidth: "5rem" }}
          />
          {errors.recurrenceConfig && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel"
        >
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="btn-submit">
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

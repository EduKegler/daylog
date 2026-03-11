"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
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
import { Text } from "@/app/components/text";
import { EmptyState } from "@/app/components/empty-state";
import { NoRecurringIllustration } from "@/app/components/empty-state-illustrations";

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

const taskItemBase = "flex items-start gap-3 py-3.5 border-b border-border transition-transform duration-200 hover:translate-x-0.5";
const actionBtn = "flex items-center justify-center w-7 h-7 rounded-md text-border bg-transparent border-none transition-all duration-200 shrink-0 group-hover:text-muted";
const actionBtnEdit = `${actionBtn} hover:text-muted hover:bg-border`;
const actionBtnDelete = `${actionBtn} hover:text-red-600 hover:bg-red-50`;
const input = "w-full py-2 text-body bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted";
const inputSmall = "w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted";

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
      className={cn(taskItemBase, "group", !task.isActive && "opacity-50", isPending && "opacity-30")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-body leading-[1.4] cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </span>
          {task.category && (
            <span className="text-tag font-medium px-2 py-0.5 rounded-full bg-border text-muted whitespace-nowrap">
              {task.category}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-small text-muted mt-0.5">{task.description}</p>
        )}
        <Text variant="small" muted className="mt-1">{label}</Text>
      </div>

      <div className="flex items-center gap-0.5">
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
    <form action={handleSubmit} className="flex flex-col gap-3 py-4 border-b border-border">
      <div>
        <Text as="label" variant="label">
          Title
        </Text>
        <input
          name="title"
          type="text"
          defaultValue={task.title}
          required
          autoFocus
          className={input}
        />
        {errors.title && (
          <p className="text-small text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <Text as="label" variant="label">
          Description (optional)
        </Text>
        <input
          name="description"
          type="text"
          defaultValue={task.description ?? ""}
          placeholder="Additional details"
          className={input}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Text as="label" variant="label">
            Category
          </Text>
          <input
            name="category"
            type="text"
            defaultValue={task.category ?? ""}
            placeholder="Optional"
            className={inputSmall}
          />
        </div>

        <div className="flex-1">
          <Text as="label" variant="label">
            Recurrence
          </Text>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
            className={inputSmall}
          >
            <option value="DAILY">Every day</option>
            <option value="WEEKDAYS">Weekdays</option>
            <option value="SPECIFIC_WEEKDAYS">Specific days</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          {errors.recurrenceType && (
            <p className="text-small text-red-600 mt-1">{errors.recurrenceType}</p>
          )}
        </div>
      </div>

      {recurrenceType === "SPECIFIC_WEEKDAYS" && (
        <div>
          <Text as="label" variant="label" className="mb-2 block">
            Days of the week
          </Text>
          <div className="flex gap-1">
            {WEEKDAYS.map((wd) => (
              <button
                key={wd.value}
                type="button"
                onClick={() => toggleDay(wd.value)}
                className={cn(
                  "px-2.5 py-1.5 text-small rounded-md transition-colors duration-200",
                  selectedDays.includes(wd.value)
                    ? "bg-accent text-white"
                    : "bg-border text-muted hover:bg-stone-300",
                )}
              >
                {wd.label}
              </button>
            ))}
          </div>
          {errors.recurrenceConfig && (
            <p className="text-small text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      {recurrenceType === "MONTHLY" && (
        <div>
          <Text as="label" variant="label">
            Day of the month
          </Text>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className={inputSmall}
            style={{ maxWidth: "5rem" }}
          />
          {errors.recurrenceConfig && (
            <p className="text-small text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900"
        >
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

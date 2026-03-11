"use client";

import { useState } from "react";
import { inputRegular, inputSmall } from "./input-styles";
import { TaskTypeSelector } from "./task-type-selector";
import { RecurrenceTypeSelector } from "./recurrence-type-selector";
import { DateSelector } from "./date-selector";
import { RecurrenceConfig } from "./recurrence-config";
import { useTaskFormSubmit } from "./use-task-form-submit";
import { FieldError } from "@/app/components/field-error";
import { CharCounter } from "@/app/components/char-counter";
import { FIELD_LIMITS } from "@/lib/tasks/validation";
import type {
  TaskFormProps,
  TaskType,
  RecurrenceTypeValue,
} from "./types";

function formatToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseRecurrenceConfig(configStr: string | null): {
  days: number[];
  daysOfMonth: number[];
} {
  if (!configStr) return { days: [], daysOfMonth: [1] };
  try {
    const parsed = JSON.parse(configStr) as Record<string, unknown>;
    const days = Array.isArray(parsed.days) ? (parsed.days as number[]) : [];
    let daysOfMonth: number[];
    if (Array.isArray(parsed.daysOfMonth)) {
      daysOfMonth = parsed.daysOfMonth as number[];
    } else if (typeof parsed.dayOfMonth === "number") {
      daysOfMonth = [parsed.dayOfMonth];
    } else {
      daysOfMonth = [1];
    }
    return { days, daysOfMonth };
  } catch {
    return { days: [], daysOfMonth: [1] };
  }
}

export function TaskForm(props: TaskFormProps): React.ReactElement {
  const { mode, onSuccess, onCancel } = props;

  const defaultType: TaskType =
    mode === "create"
      ? (props.defaultTaskType ?? "one-time")
      : props.taskType;

  const initialTitle =
    mode === "edit" ? props.initialData.title : "";
  const initialDescription =
    mode === "edit" ? (props.initialData.description ?? "") : "";
  const initialCategory =
    mode === "edit" ? (props.initialData.category ?? "") : "";

  const initialScheduledDate =
    mode === "edit" && props.taskType === "one-time"
      ? props.initialData.scheduledDate
      : formatToday();

  const initialRecurrenceType: RecurrenceTypeValue =
    mode === "edit" && props.taskType === "recurring"
      ? (props.initialData.recurrenceType as RecurrenceTypeValue)
      : "DAILY";

  const initialRecurrenceConfig =
    mode === "edit" && props.taskType === "recurring"
      ? parseRecurrenceConfig(props.initialData.recurrenceConfig)
      : { days: [], daysOfMonth: [] };

  const [taskType, setTaskType] = useState<TaskType>(defaultType);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate);
  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceTypeValue>(initialRecurrenceType);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialRecurrenceConfig.days,
  );
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>(
    initialRecurrenceConfig.daysOfMonth,
  );

  const { submit, isPending, errors, setErrors } = useTaskFormSubmit();

  const taskId = mode === "edit" ? props.taskId : undefined;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit({
      mode,
      taskType,
      taskId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      scheduledDate,
      recurrenceType,
      selectedDays,
      daysOfMonth,
      onSuccess,
    });
  }

  function handleCancel() {
    setErrors({});
    onCancel();
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  const isCreate = mode === "create";
  const submitLabel = isCreate
    ? isPending
      ? "Creating..."
      : "Create"
    : isPending
      ? "Saving..."
      : "Save";

  const trimmedTitle = title.trim();
  const hasRequiredRecurrenceConfig =
    taskType !== "recurring" ||
    recurrenceType === "DAILY" ||
    recurrenceType === "WEEKDAYS" ||
    (recurrenceType === "SPECIFIC_WEEKDAYS" && selectedDays.length > 0) ||
    (recurrenceType === "MONTHLY" && daysOfMonth.length > 0);
  const isWithinLimits =
    trimmedTitle.length <= FIELD_LIMITS.title &&
    description.length <= FIELD_LIMITS.description &&
    category.length <= FIELD_LIMITS.category;
  const isFormValid =
    trimmedTitle.length > 0 && isWithinLimits && hasRequiredRecurrenceConfig;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 py-4 border-b border-border"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={taskType === "recurring" ? "What recurs?" : "What do you need to do?"}
        required
        autoFocus
        className={inputRegular}
      />
      <div className="flex justify-between">
        <FieldError message={errors.title} />
        <CharCounter current={title.length} max={FIELD_LIMITS.title} />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={5}
        className={inputSmall}
      />
      <CharCounter current={description.length} max={FIELD_LIMITS.description} />

      <div>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (optional)"
          className={inputSmall}
        />
        <FieldError message={errors.category} />
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          {isCreate ? (
            <TaskTypeSelector value={taskType} onChange={setTaskType} />
          ) : (
            <span className="inline-block px-3 py-1.5 text-small font-medium rounded-md bg-border text-muted">
              {taskType === "one-time" ? "One-time" : "Recurring"}
            </span>
          )}
        </div>
        <div className="flex-1">
          {taskType === "one-time" ? (
            <DateSelector value={scheduledDate} onChange={setScheduledDate} />
          ) : (
            <RecurrenceTypeSelector value={recurrenceType} onChange={setRecurrenceType} />
          )}
        </div>
      </div>
      {taskType === "one-time" && <FieldError message={errors.scheduledDate} />}
      {taskType === "recurring" && (
        <>
          <FieldError message={errors.recurrenceType} />
          <RecurrenceConfig
            recurrenceType={recurrenceType}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
            daysOfMonth={daysOfMonth}
            onDaysOfMonthChange={setDaysOfMonth}
            errors={errors}
          />
        </>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !isFormValid}
          className="text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

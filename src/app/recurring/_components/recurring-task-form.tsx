"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { createRecurringTask, type ActionResult } from "@/lib/tasks/actions";
import { Text } from "@/app/components/text";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const input = "w-full py-2 text-body bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted";
const inputSmall = "w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted";

export function RecurringTaskForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recurrenceType, setRecurrenceType] = useState("DAILY");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function buildConfig(): string | null {
    if (recurrenceType === "SPECIFIC_WEEKDAYS") {
      return JSON.stringify({ days: selectedDays });
    }
    if (recurrenceType === "MONTHLY") {
      return JSON.stringify({ dayOfMonth });
    }
    return null;
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(formData: FormData) {
    const config = buildConfig();
    if (config) {
      formData.set("recurrenceConfig", config);
    }
    formData.set("recurrenceType", recurrenceType);

    startTransition(async () => {
      const result: ActionResult = await createRecurringTask(formData);
      if (result.success) {
        formRef.current?.reset();
        setRecurrenceType("DAILY");
        setSelectedDays([]);
        setDayOfMonth(1);
        setErrors({});
        setIsOpen(false);
      } else if (result.errors) {
        setErrors(result.errors);
      }
    });
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 w-full py-3.5 text-subtext text-muted bg-transparent border-0 border-b border-border transition-colors duration-200 hover:text-accent">
        <span className="text-icon leading-none">+</span>
        New recurring task
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3 py-4 border-b border-border">
      <div>
        <Text as="label" variant="label">
          Title
        </Text>
        <input
          name="title"
          type="text"
          placeholder="What recurs?"
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
          onClick={() => {
            setIsOpen(false);
            setErrors({});
          }}
          className="text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900"
        >
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

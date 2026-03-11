import { useState, useEffect } from "react";
import { Text } from "@/app/components/text";
import { FieldError } from "@/app/components/field-error";
import { inputSmall } from "./input-styles";
import { WeekdayToggles } from "./weekday-toggles";
import type { RecurrenceTypeValue } from "./types";

function parseDaysText(text: string): number[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map(Number)
    .filter((n) => !isNaN(n));
}

export function RecurrenceConfig({
  recurrenceType,
  selectedDays,
  onToggleDay,
  daysOfMonth,
  onDaysOfMonthChange,
  errors,
}: {
  recurrenceType: RecurrenceTypeValue;
  selectedDays: number[];
  onToggleDay: (day: number) => void;
  daysOfMonth: number[];
  onDaysOfMonthChange: (days: number[]) => void;
  errors: Record<string, string>;
}): React.ReactElement | null {
  const [daysOfMonthText, setDaysOfMonthText] = useState(
    daysOfMonth.join(", "),
  );

  useEffect(() => {
    setDaysOfMonthText(daysOfMonth.join(", "));
  }, [daysOfMonth]);

  function handleDaysOfMonthChange(text: string): void {
    setDaysOfMonthText(text);
    onDaysOfMonthChange(parseDaysText(text));
  }

  if (recurrenceType === "SPECIFIC_WEEKDAYS") {
    return (
      <div>
        <Text as="label" variant="label" className="mb-2 block">
          Days of the week
        </Text>
        <WeekdayToggles selectedDays={selectedDays} onToggle={onToggleDay} />
        <FieldError message={errors.recurrenceConfig} />
      </div>
    );
  }

  if (recurrenceType === "MONTHLY") {
    return (
      <div>
        <Text as="label" variant="label">
          Days of the month
        </Text>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1, 15"
          value={daysOfMonthText}
          onChange={(e) => handleDaysOfMonthChange(e.target.value)}
          className={inputSmall}
        />
        <FieldError message={errors.recurrenceConfig} />
      </div>
    );
  }

  return null;
}

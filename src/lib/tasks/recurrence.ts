export type SpecificWeekdaysConfig = {
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
};

export type MonthlyConfig = {
  dayOfMonth: number; // 1-31
};

export type RecurrenceConfig = SpecificWeekdaysConfig | MonthlyConfig | null;

type RecurrenceType = "DAILY" | "WEEKDAYS" | "SPECIFIC_WEEKDAYS" | "MONTHLY";

export function parseRecurrenceConfig(
  type: RecurrenceType,
  configStr: string | null,
): RecurrenceConfig {
  if (type === "DAILY" || type === "WEEKDAYS") {
    return null;
  }

  if (!configStr) {
    throw new Error(`recurrenceConfig is required for type ${type}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(configStr);
  } catch {
    throw new Error(`Invalid recurrenceConfig JSON: ${configStr}`);
  }

  if (type === "SPECIFIC_WEEKDAYS") {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("days" in parsed) ||
      !Array.isArray((parsed as SpecificWeekdaysConfig).days)
    ) {
      throw new Error("SPECIFIC_WEEKDAYS requires { days: number[] }");
    }
    const days = (parsed as SpecificWeekdaysConfig).days;
    if (days.length === 0) {
      throw new Error("SPECIFIC_WEEKDAYS requires at least one day");
    }
    for (const d of days) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        throw new Error(`Invalid day: ${d}. Must be 0-6`);
      }
    }
    return { days } as SpecificWeekdaysConfig;
  }

  if (type === "MONTHLY") {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("dayOfMonth" in parsed) ||
      typeof (parsed as MonthlyConfig).dayOfMonth !== "number"
    ) {
      throw new Error("MONTHLY requires { dayOfMonth: number }");
    }
    const { dayOfMonth } = parsed as MonthlyConfig;
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error(`Invalid dayOfMonth: ${dayOfMonth}. Must be 1-31`);
    }
    return { dayOfMonth } as MonthlyConfig;
  }

  throw new Error(`Unknown recurrence type: ${type}`);
}

export function shouldTaskOccurOnDate(
  type: RecurrenceType,
  config: RecurrenceConfig,
  date: Date,
): boolean {
  const dayOfWeek = date.getUTCDay(); // 0=Sun, 6=Sat

  switch (type) {
    case "DAILY":
      return true;

    case "WEEKDAYS":
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case "SPECIFIC_WEEKDAYS": {
      const { days } = config as SpecificWeekdaysConfig;
      return days.includes(dayOfWeek);
    }

    case "MONTHLY": {
      const { dayOfMonth } = config as MonthlyConfig;
      const lastDay = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
      ).getUTCDate();
      if (dayOfMonth > lastDay) return false;
      return date.getUTCDate() === dayOfMonth;
    }

    default:
      return false;
  }
}

const WEEKDAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getRecurrenceLabel(
  type: RecurrenceType,
  config: RecurrenceConfig,
): string {
  switch (type) {
    case "DAILY":
      return "Every day";
    case "WEEKDAYS":
      return "Weekdays";
    case "SPECIFIC_WEEKDAYS": {
      const { days } = config as SpecificWeekdaysConfig;
      const sorted = [...days].sort((a, b) => a - b);
      return sorted.map((d) => WEEKDAY_NAMES_SHORT[d]).join(", ");
    }
    case "MONTHLY": {
      const { dayOfMonth } = config as MonthlyConfig;
      return `Day ${dayOfMonth} of each month`;
    }
    default:
      return type;
  }
}

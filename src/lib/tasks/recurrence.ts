export type SpecificWeekdaysConfig = {
  days: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
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
    throw new Error(`recurrenceConfig é obrigatório para tipo ${type}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(configStr);
  } catch {
    throw new Error(`recurrenceConfig JSON inválido: ${configStr}`);
  }

  if (type === "SPECIFIC_WEEKDAYS") {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("days" in parsed) ||
      !Array.isArray((parsed as SpecificWeekdaysConfig).days)
    ) {
      throw new Error("SPECIFIC_WEEKDAYS requer { days: number[] }");
    }
    const days = (parsed as SpecificWeekdaysConfig).days;
    if (days.length === 0) {
      throw new Error("SPECIFIC_WEEKDAYS requer ao menos um dia");
    }
    for (const d of days) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        throw new Error(`Dia inválido: ${d}. Deve ser 0-6`);
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
      throw new Error("MONTHLY requer { dayOfMonth: number }");
    }
    const { dayOfMonth } = parsed as MonthlyConfig;
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error(`dayOfMonth inválido: ${dayOfMonth}. Deve ser 1-31`);
    }
    return { dayOfMonth } as MonthlyConfig;
  }

  throw new Error(`Tipo de recorrência desconhecido: ${type}`);
}

export function shouldTaskOccurOnDate(
  type: RecurrenceType,
  config: RecurrenceConfig,
  date: Date,
): boolean {
  const dayOfWeek = date.getUTCDay(); // 0=Dom, 6=Sáb

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

const WEEKDAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getRecurrenceLabel(
  type: RecurrenceType,
  config: RecurrenceConfig,
): string {
  switch (type) {
    case "DAILY":
      return "Todos os dias";
    case "WEEKDAYS":
      return "Dias úteis";
    case "SPECIFIC_WEEKDAYS": {
      const { days } = config as SpecificWeekdaysConfig;
      const sorted = [...days].sort((a, b) => a - b);
      return sorted.map((d) => WEEKDAY_NAMES_SHORT[d]).join(", ");
    }
    case "MONTHLY": {
      const { dayOfMonth } = config as MonthlyConfig;
      return `Dia ${dayOfMonth} de cada mês`;
    }
    default:
      return type;
  }
}

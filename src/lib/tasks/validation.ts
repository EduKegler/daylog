import { z } from "zod";

const RECURRENCE_TYPES = ["DAILY", "WEEKDAYS", "SPECIFIC_WEEKDAYS", "MONTHLY"] as const;
type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export const FIELD_LIMITS = {
  title: 75,
  description: 450,
  category: 50,
} as const;

const commonFieldsSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(
      FIELD_LIMITS.title,
      `Title must be at most ${FIELD_LIMITS.title} characters`,
    ),
  description: z
    .string()
    .max(
      FIELD_LIMITS.description,
      `Description must be at most ${FIELD_LIMITS.description} characters`,
    ),
  category: z
    .string()
    .max(
      FIELD_LIMITS.category,
      `Category must be at most ${FIELD_LIMITS.category} characters`,
    ),
});

function issuesToRecord(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export type RecurringTaskInput = {
  title: string;
  description: string | null;
  category: string | null;
  recurrenceType: RecurrenceType;
  recurrenceConfig: string | null;
};

export function validateCommonFields(data: {
  title?: string;
  description?: string;
  category?: string;
}): {
  title: string;
  description: string | null;
  category: string | null;
  errors: Record<string, string>;
} {
  const trimmed = {
    title: (data.title ?? "").trim(),
    description: (data.description ?? "").trim(),
    category: (data.category ?? "").trim(),
  };

  const result = commonFieldsSchema.safeParse(trimmed);

  if (result.success) {
    return {
      title: result.data.title,
      description: result.data.description || null,
      category: result.data.category || null,
      errors: {},
    };
  }

  return {
    title: trimmed.title,
    description: trimmed.description || null,
    category: trimmed.category || null,
    errors: issuesToRecord(result.error.issues),
  };
}

export function validateRecurringTaskInput(data: {
  title?: string;
  description?: string;
  category?: string;
  recurrenceType?: string;
  recurrenceConfig?: string;
}): ValidationResult<RecurringTaskInput> {
  const { title, description, category, errors } = validateCommonFields(data);

  // RecurrenceType
  const recurrenceType = data.recurrenceType as RecurrenceType;
  if (!recurrenceType || !RECURRENCE_TYPES.includes(recurrenceType)) {
    errors.recurrenceType = "Invalid recurrence type";
  }

  // RecurrenceConfig
  if (!errors.recurrenceType) {
    const configErrors = validateRecurrenceConfig(
      recurrenceType,
      data.recurrenceConfig ?? null,
    );
    if (configErrors) {
      errors.recurrenceConfig = configErrors;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      description,
      category,
      recurrenceType,
      recurrenceConfig: normalizeConfig(recurrenceType, data.recurrenceConfig ?? null),
    },
  };
}

function validateRecurrenceConfig(
  type: RecurrenceType,
  configStr: string | null,
): string | null {
  if (type === "DAILY" || type === "WEEKDAYS") {
    return null; // config not required
  }

  if (!configStr) {
    return `Configuration is required for ${type}`;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(configStr);
  } catch {
    return "Invalid JSON configuration";
  }

  if (type === "SPECIFIC_WEEKDAYS") {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("days" in parsed) ||
      !Array.isArray((parsed as { days: unknown }).days)
    ) {
      return "Select at least one day of the week";
    }
    const days = (parsed as { days: number[] }).days;
    if (days.length === 0) return "Select at least one day of the week";
    for (const d of days) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        return `Invalid day: ${d}`;
      }
    }
    return null;
  }

  if (type === "MONTHLY") {
    if (!parsed || typeof parsed !== "object") {
      return "Select at least one day of the month";
    }
    const obj = parsed as Record<string, unknown>;
    let daysOfMonth: number[];
    if ("daysOfMonth" in parsed && Array.isArray(obj.daysOfMonth)) {
      daysOfMonth = obj.daysOfMonth as number[];
    } else if ("dayOfMonth" in parsed && typeof obj.dayOfMonth === "number") {
      daysOfMonth = [obj.dayOfMonth];
    } else {
      return "Select at least one day of the month";
    }
    if (daysOfMonth.length === 0) {
      return "Select at least one day of the month";
    }
    for (const d of daysOfMonth) {
      if (!Number.isInteger(d) || d < 1 || d > 31) {
        return `Day of the month must be between 1 and 31 (got ${d})`;
      }
    }
    return null;
  }

  return "Invalid recurrence type";
}

function normalizeConfig(type: RecurrenceType, configStr: string | null): string | null {
  if (type === "DAILY" || type === "WEEKDAYS") return null;
  if (!configStr) return configStr;

  if (type === "MONTHLY") {
    const parsed = JSON.parse(configStr) as Record<string, unknown>;
    let daysOfMonth: number[];
    if ("daysOfMonth" in parsed && Array.isArray(parsed.daysOfMonth)) {
      daysOfMonth = parsed.daysOfMonth as number[];
    } else if ("dayOfMonth" in parsed && typeof parsed.dayOfMonth === "number") {
      daysOfMonth = [parsed.dayOfMonth];
    } else {
      return configStr;
    }
    const sorted = [...new Set(daysOfMonth)].sort((a, b) => a - b);
    return JSON.stringify({ daysOfMonth: sorted });
  }

  return configStr;
}

export type TaskInput = {
  title: string;
  description: string | null;
  category: string | null;
  scheduledDate: Date;
};

export function validateTaskInput(data: {
  title?: string;
  description?: string;
  category?: string;
  scheduledDate?: string;
}): ValidationResult<TaskInput> {
  const { title, description, category, errors } = validateCommonFields(data);

  // ScheduledDate
  const dateStr = data.scheduledDate ?? "";
  const scheduledDate = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  if (dateStr && isNaN(scheduledDate.getTime())) {
    errors.scheduledDate = "Invalid date";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { title, description, category, scheduledDate },
  };
}

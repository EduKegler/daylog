const RECURRENCE_TYPES = ["DAILY", "WEEKDAYS", "SPECIFIC_WEEKDAYS", "MONTHLY"] as const;
type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export type RecurringTaskInput = {
  title: string;
  description: string | null;
  category: string | null;
  recurrenceType: RecurrenceType;
  recurrenceConfig: string | null;
};

function validateCommonFields(data: {
  title?: string;
  description?: string;
  category?: string;
}): {
  title: string;
  description: string | null;
  category: string | null;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = data.title?.trim() ?? "";
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > 200) {
    errors.title = "Title must be at most 200 characters";
  }

  const description = data.description?.trim() || null;
  if (description && description.length > 2000) {
    errors.description = "Description must be at most 2000 characters";
  }

  const category = data.category?.trim() || null;
  if (category && category.length > 50) {
    errors.category = "Category must be at most 50 characters";
  }

  return { title, description, category, errors };
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
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("dayOfMonth" in parsed) ||
      typeof (parsed as { dayOfMonth: unknown }).dayOfMonth !== "number"
    ) {
      return "Select the day of the month";
    }
    const { dayOfMonth } = parsed as { dayOfMonth: number };
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return "Day of the month must be between 1 and 31";
    }
    return null;
  }

  return "Invalid recurrence type";
}

function normalizeConfig(type: RecurrenceType, configStr: string | null): string | null {
  if (type === "DAILY" || type === "WEEKDAYS") return null;
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

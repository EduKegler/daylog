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
    errors.title = "Título é obrigatório";
  } else if (title.length > 200) {
    errors.title = "Título deve ter no máximo 200 caracteres";
  }

  const description = data.description?.trim() || null;
  if (description && description.length > 2000) {
    errors.description = "Descrição deve ter no máximo 2000 caracteres";
  }

  const category = data.category?.trim() || null;
  if (category && category.length > 50) {
    errors.category = "Categoria deve ter no máximo 50 caracteres";
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
    errors.recurrenceType = "Tipo de recorrência inválido";
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
    return null; // config não necessária
  }

  if (!configStr) {
    return `Configuração é obrigatória para ${type}`;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(configStr);
  } catch {
    return "Configuração JSON inválida";
  }

  if (type === "SPECIFIC_WEEKDAYS") {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("days" in parsed) ||
      !Array.isArray((parsed as { days: unknown }).days)
    ) {
      return "Selecione ao menos um dia da semana";
    }
    const days = (parsed as { days: number[] }).days;
    if (days.length === 0) return "Selecione ao menos um dia da semana";
    for (const d of days) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        return `Dia inválido: ${d}`;
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
      return "Selecione o dia do mês";
    }
    const { dayOfMonth } = parsed as { dayOfMonth: number };
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return "Dia do mês deve ser entre 1 e 31";
    }
    return null;
  }

  return "Tipo de recorrência inválido";
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
    errors.scheduledDate = "Data inválida";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { title, description, category, scheduledDate },
  };
}

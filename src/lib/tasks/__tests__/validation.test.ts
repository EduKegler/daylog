import { describe, it, expect } from "vitest";
import { validateRecurringTaskInput, validateTaskInput } from "../validation";

describe("validateRecurringTaskInput", () => {
  const validInput = {
    title: "Minha tarefa",
    recurrenceType: "DAILY",
  };

  it("aceita input válido DAILY", () => {
    const result = validateRecurringTaskInput(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Minha tarefa");
      expect(result.data.recurrenceType).toBe("DAILY");
      expect(result.data.recurrenceConfig).toBeNull();
    }
  });

  it("aceita input com todos os campos", () => {
    const result = validateRecurringTaskInput({
      title: "Tarefa completa",
      description: "Uma descrição",
      category: "Trabalho",
      recurrenceType: "DAILY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Uma descrição");
      expect(result.data.category).toBe("Trabalho");
    }
  });

  // Title validation
  it("rejeita título vazio", () => {
    const result = validateRecurringTaskInput({ ...validInput, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejeita título só com espaços", () => {
    const result = validateRecurringTaskInput({ ...validInput, title: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejeita título sem título", () => {
    const result = validateRecurringTaskInput({ recurrenceType: "DAILY" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejeita título > 200 caracteres", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toContain("200");
  });

  it("faz trim do título", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      title: "  Minha tarefa  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Minha tarefa");
  });

  // Description validation
  it("aceita descrição null/vazia", () => {
    const result = validateRecurringTaskInput({ ...validInput, description: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("rejeita descrição > 2000 caracteres", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.description).toContain("2000");
  });

  // Category validation
  it("aceita categoria vazia", () => {
    const result = validateRecurringTaskInput({ ...validInput, category: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBeNull();
  });

  it("rejeita categoria > 50 caracteres", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      category: "a".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.category).toContain("50");
  });

  // RecurrenceType validation
  it("rejeita tipo inválido", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "INVALID",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceType).toBeDefined();
  });

  it("rejeita tipo ausente", () => {
    const result = validateRecurringTaskInput({ title: "Tarefa" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceType).toBeDefined();
  });

  // RecurrenceConfig validation
  it("aceita WEEKDAYS sem config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "WEEKDAYS",
    });
    expect(result.success).toBe(true);
  });

  it("aceita SPECIFIC_WEEKDAYS com config válida", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [1, 3, 5] }),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurrenceConfig).toBe(JSON.stringify({ days: [1, 3, 5] }));
    }
  });

  it("rejeita SPECIFIC_WEEKDAYS sem config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejeita SPECIFIC_WEEKDAYS com days vazio", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [] }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("aceita MONTHLY com config válida", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ dayOfMonth: 15 }),
    });
    expect(result.success).toBe(true);
  });

  it("rejeita MONTHLY sem config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejeita MONTHLY com dayOfMonth fora do range", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ dayOfMonth: 32 }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  // Múltiplos erros
  it("retorna múltiplos erros", () => {
    const result = validateRecurringTaskInput({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.recurrenceType).toBeDefined();
    }
  });

  // Edge: config inválida (objeto sem as props certas)
  it("rejeita SPECIFIC_WEEKDAYS com config sem days", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ foo: "bar" }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejeita SPECIFIC_WEEKDAYS com dia inválido", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [8] }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toContain("8");
  });

  it("rejeita MONTHLY com config sem dayOfMonth", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ foo: 1 }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejeita config JSON inválido", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: "not-json",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toContain("JSON");
  });
});

describe("validateTaskInput", () => {
  it("aceita input válido", () => {
    const result = validateTaskInput({
      title: "Minha tarefa",
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Minha tarefa");
      expect(result.data.scheduledDate).toBeInstanceOf(Date);
    }
  });

  it("faz trim no título", () => {
    const result = validateTaskInput({
      title: "  Tarefa  ",
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Tarefa");
  });

  it("rejeita título vazio", () => {
    const result = validateTaskInput({ title: "", scheduledDate: "2026-03-09" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejeita título > 200 caracteres", () => {
    const result = validateTaskInput({
      title: "a".repeat(201),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toContain("200");
  });

  it("rejeita descrição > 2000 caracteres", () => {
    const result = validateTaskInput({
      title: "Task",
      description: "a".repeat(2001),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.description).toContain("2000");
  });

  it("rejeita categoria > 50 caracteres", () => {
    const result = validateTaskInput({
      title: "Task",
      category: "a".repeat(51),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.category).toContain("50");
  });

  it("rejeita data inválida", () => {
    const result = validateTaskInput({
      title: "Task",
      scheduledDate: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.scheduledDate).toBeDefined();
  });

  it("aceita sem data (usa data atual)", () => {
    const result = validateTaskInput({ title: "Task" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.scheduledDate).toBeInstanceOf(Date);
  });

  it("converte campos opcionais vazios para null", () => {
    const result = validateTaskInput({
      title: "Task",
      description: "",
      category: "",
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.category).toBeNull();
    }
  });
});

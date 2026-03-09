import { describe, it, expect } from "vitest";
import { validateRecurringTaskInput, validateTaskInput } from "../validation";

describe("validateRecurringTaskInput", () => {
  const validInput = {
    title: "My task",
    recurrenceType: "DAILY",
  };

  it("accepts valid DAILY input", () => {
    const result = validateRecurringTaskInput(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My task");
      expect(result.data.recurrenceType).toBe("DAILY");
      expect(result.data.recurrenceConfig).toBeNull();
    }
  });

  it("accepts input with all fields", () => {
    const result = validateRecurringTaskInput({
      title: "Complete task",
      description: "A description",
      category: "Work",
      recurrenceType: "DAILY",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("A description");
      expect(result.data.category).toBe("Work");
    }
  });

  // Title validation
  it("rejects empty title", () => {
    const result = validateRecurringTaskInput({ ...validInput, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejects whitespace-only title", () => {
    const result = validateRecurringTaskInput({ ...validInput, title: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejects missing title", () => {
    const result = validateRecurringTaskInput({ recurrenceType: "DAILY" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejects title > 200 characters", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toContain("200");
  });

  it("trims the title", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      title: "  My task  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("My task");
  });

  // Description validation
  it("accepts null/empty description", () => {
    const result = validateRecurringTaskInput({ ...validInput, description: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("rejects description > 2000 characters", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.description).toContain("2000");
  });

  // Category validation
  it("accepts empty category", () => {
    const result = validateRecurringTaskInput({ ...validInput, category: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBeNull();
  });

  it("rejects category > 50 characters", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      category: "a".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.category).toContain("50");
  });

  // RecurrenceType validation
  it("rejects invalid type", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "INVALID",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceType).toBeDefined();
  });

  it("rejects missing type", () => {
    const result = validateRecurringTaskInput({ title: "Task" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceType).toBeDefined();
  });

  // RecurrenceConfig validation
  it("accepts WEEKDAYS without config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "WEEKDAYS",
    });
    expect(result.success).toBe(true);
  });

  it("accepts SPECIFIC_WEEKDAYS with valid config", () => {
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

  it("rejects SPECIFIC_WEEKDAYS without config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejects SPECIFIC_WEEKDAYS with empty days", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [] }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("accepts MONTHLY with valid config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ dayOfMonth: 15 }),
    });
    expect(result.success).toBe(true);
  });

  it("rejects MONTHLY without config", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejects MONTHLY with dayOfMonth out of range", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ dayOfMonth: 32 }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  // Multiple errors
  it("returns multiple errors", () => {
    const result = validateRecurringTaskInput({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.recurrenceType).toBeDefined();
    }
  });

  // Edge: invalid config (object without the right props)
  it("rejects SPECIFIC_WEEKDAYS with config missing days", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ foo: "bar" }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejects SPECIFIC_WEEKDAYS with invalid day", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [8] }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toContain("8");
  });

  it("rejects MONTHLY with config missing dayOfMonth", () => {
    const result = validateRecurringTaskInput({
      ...validInput,
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ foo: 1 }),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.recurrenceConfig).toBeDefined();
  });

  it("rejects invalid JSON config", () => {
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
  it("accepts valid input", () => {
    const result = validateTaskInput({
      title: "My task",
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My task");
      expect(result.data.scheduledDate).toBeInstanceOf(Date);
    }
  });

  it("trims the title", () => {
    const result = validateTaskInput({
      title: "  Task  ",
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Task");
  });

  it("rejects empty title", () => {
    const result = validateTaskInput({ title: "", scheduledDate: "2026-03-09" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toBeDefined();
  });

  it("rejects title > 200 characters", () => {
    const result = validateTaskInput({
      title: "a".repeat(201),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.title).toContain("200");
  });

  it("rejects description > 2000 characters", () => {
    const result = validateTaskInput({
      title: "Task",
      description: "a".repeat(2001),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.description).toContain("2000");
  });

  it("rejects category > 50 characters", () => {
    const result = validateTaskInput({
      title: "Task",
      category: "a".repeat(51),
      scheduledDate: "2026-03-09",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.category).toContain("50");
  });

  it("rejects invalid date", () => {
    const result = validateTaskInput({
      title: "Task",
      scheduledDate: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.scheduledDate).toBeDefined();
  });

  it("accepts missing date (uses current date)", () => {
    const result = validateTaskInput({ title: "Task" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.scheduledDate).toBeInstanceOf(Date);
  });

  it("converts empty optional fields to null", () => {
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

import { describe, it, expect } from "vitest";
import {
  parseRecurrenceConfig,
  shouldTaskOccurOnDate,
  getRecurrenceLabel,
} from "../recurrence";

// Helper: creates a UTC Date for a specific weekday
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("parseRecurrenceConfig", () => {
  it("returns null for DAILY", () => {
    expect(parseRecurrenceConfig("DAILY", null)).toBeNull();
  });

  it("returns null for WEEKDAYS", () => {
    expect(parseRecurrenceConfig("WEEKDAYS", null)).toBeNull();
  });

  it("ignores config string for DAILY", () => {
    expect(parseRecurrenceConfig("DAILY", '{"foo":1}')).toBeNull();
  });

  it("parses SPECIFIC_WEEKDAYS correctly", () => {
    const result = parseRecurrenceConfig(
      "SPECIFIC_WEEKDAYS",
      JSON.stringify({ days: [1, 3, 5] }),
    );
    expect(result).toEqual({ days: [1, 3, 5] });
  });

  it("parses MONTHLY with daysOfMonth array", () => {
    const result = parseRecurrenceConfig(
      "MONTHLY",
      JSON.stringify({ daysOfMonth: [1, 15, 28] }),
    );
    expect(result).toEqual({ daysOfMonth: [1, 15, 28] });
  });

  it("parses MONTHLY with single daysOfMonth", () => {
    const result = parseRecurrenceConfig(
      "MONTHLY",
      JSON.stringify({ daysOfMonth: [10] }),
    );
    expect(result).toEqual({ daysOfMonth: [10] });
  });

  it("parses MONTHLY backward compat: dayOfMonth number → daysOfMonth array", () => {
    const result = parseRecurrenceConfig(
      "MONTHLY",
      JSON.stringify({ dayOfMonth: 15 }),
    );
    expect(result).toEqual({ daysOfMonth: [15] });
  });

  it("throws error if config is null for SPECIFIC_WEEKDAYS", () => {
    expect(() => parseRecurrenceConfig("SPECIFIC_WEEKDAYS", null)).toThrow(
      "required",
    );
  });

  it("throws error if config is null for MONTHLY", () => {
    expect(() => parseRecurrenceConfig("MONTHLY", null)).toThrow("required");
  });

  it("throws error for malformed JSON", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", "not-json"),
    ).toThrow("Invalid");
  });

  it("throws error if days is not an array", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: "1,3" })),
    ).toThrow("SPECIFIC_WEEKDAYS requires");
  });

  it("throws error if days is empty", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [] })),
    ).toThrow("at least one day");
  });

  it("throws error for day outside range 0-6", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [7] })),
    ).toThrow("Invalid day: 7");
  });

  it("throws error for negative day", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [-1] })),
    ).toThrow("Invalid day: -1");
  });

  it("throws error if daysOfMonth is not an array", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ daysOfMonth: 15 })),
    ).toThrow("MONTHLY requires");
  });

  it("throws error if MONTHLY config has neither daysOfMonth nor dayOfMonth", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ foo: 1 })),
    ).toThrow("MONTHLY requires");
  });

  it("throws error for empty daysOfMonth array", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ daysOfMonth: [] })),
    ).toThrow("at least one day");
  });

  it("throws error for daysOfMonth with 0", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ daysOfMonth: [0] })),
    ).toThrow("Invalid day of month: 0");
  });

  it("throws error for daysOfMonth with 32", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ daysOfMonth: [32] })),
    ).toThrow("Invalid day of month: 32");
  });

  it("throws error for daysOfMonth with non-integer", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ daysOfMonth: [1.5] })),
    ).toThrow("Invalid day of month: 1.5");
  });

  it("throws error for unknown type", () => {
    expect(() =>
      parseRecurrenceConfig("UNKNOWN" as never, "{}"),
    ).toThrow("Unknown recurrence type");
  });

  it("throws when MONTHLY config is valid JSON but not an object (e.g. string)", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify("not-an-object")),
    ).toThrow("MONTHLY requires");
  });
});

describe("shouldTaskOccurOnDate", () => {
  describe("DAILY", () => {
    it("returns true for any day", () => {
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 9))).toBe(true); // Mon
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 14))).toBe(true); // Sat
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 15))).toBe(true); // Sun
    });
  });

  describe("WEEKDAYS", () => {
    it("returns true for Monday through Friday", () => {
      // 2026-03-09 = Monday
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 9))).toBe(true);
      // 2026-03-10 = Tuesday
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 10))).toBe(true);
      // 2026-03-13 = Friday
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 13))).toBe(true);
    });

    it("returns false for Saturday and Sunday", () => {
      // 2026-03-14 = Saturday
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 14))).toBe(false);
      // 2026-03-15 = Sunday
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 15))).toBe(false);
    });
  });

  describe("SPECIFIC_WEEKDAYS", () => {
    const config = { days: [1, 3, 5] }; // Mon, Wed, Fri

    it("returns true for included days", () => {
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 9))).toBe(true);  // Mon
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 11))).toBe(true); // Wed
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 13))).toBe(true); // Fri
    });

    it("returns false for non-included days", () => {
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 10))).toBe(false); // Tue
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 12))).toBe(false); // Thu
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 14))).toBe(false); // Sat
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 15))).toBe(false); // Sun
    });
  });

  describe("MONTHLY", () => {
    it("returns true when date matches one of daysOfMonth", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [1, 15, 28] }, utcDate(2026, 3, 15))).toBe(true);
    });

    it("returns true for first day in daysOfMonth", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [1, 15] }, utcDate(2026, 6, 1))).toBe(true);
    });

    it("returns false when date does not match any daysOfMonth", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [1, 15, 28] }, utcDate(2026, 3, 14))).toBe(false);
    });

    it("returns false for day 31 in a month with 30 days", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [31] }, utcDate(2026, 4, 30))).toBe(false);
    });

    it("returns true for day 29 in February of a leap year", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [29] }, utcDate(2028, 2, 29))).toBe(true);
    });

    it("returns false for day 29 in February of a non-leap year", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [29] }, utcDate(2026, 2, 28))).toBe(false);
    });

    it("returns true with single-element array", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { daysOfMonth: [10] }, utcDate(2026, 3, 10))).toBe(true);
    });
  });

  describe("unknown type", () => {
    it("returns false", () => {
      expect(shouldTaskOccurOnDate("UNKNOWN" as never, null, utcDate(2026, 3, 9))).toBe(false);
    });
  });
});

describe("getRecurrenceLabel", () => {
  it("returns label for DAILY", () => {
    expect(getRecurrenceLabel("DAILY", null)).toBe("Every day");
  });

  it("returns label for WEEKDAYS", () => {
    expect(getRecurrenceLabel("WEEKDAYS", null)).toBe("Weekdays");
  });

  it("returns label for SPECIFIC_WEEKDAYS", () => {
    expect(getRecurrenceLabel("SPECIFIC_WEEKDAYS", { days: [1, 3, 5] })).toBe(
      "Mon, Wed, Fri",
    );
  });

  it("sorts the days in label", () => {
    expect(getRecurrenceLabel("SPECIFIC_WEEKDAYS", { days: [5, 1, 3] })).toBe(
      "Mon, Wed, Fri",
    );
  });

  it("returns label for MONTHLY with single day", () => {
    expect(getRecurrenceLabel("MONTHLY", { daysOfMonth: [10] })).toBe(
      "Day 10 of each month",
    );
  });

  it("returns label for MONTHLY with multiple days", () => {
    expect(getRecurrenceLabel("MONTHLY", { daysOfMonth: [1, 15, 28] })).toBe(
      "Days 1, 15, 28 of each month",
    );
  });

  it("returns type as fallback for unknown type", () => {
    expect(getRecurrenceLabel("UNKNOWN" as never, null)).toBe("UNKNOWN");
  });
});

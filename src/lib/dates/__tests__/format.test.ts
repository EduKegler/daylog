import { describe, it, expect } from "vitest";
import { formatLongDate, formatShortDate } from "../format";

describe("formatLongDate", () => {
  it("formats date in en-US with weekday", () => {
    // 2026-03-09 = Monday
    const date = new Date(Date.UTC(2026, 2, 9));
    const result = formatLongDate(date);
    expect(result).toContain("Monday");
    expect(result).toContain("9");
    expect(result).toContain("March");
  });

  it("formats another date correctly", () => {
    // 2026-01-01 = Thursday
    const date = new Date(Date.UTC(2026, 0, 1));
    const result = formatLongDate(date);
    expect(result).toContain("Thursday");
    expect(result).toContain("1");
    expect(result).toContain("January");
  });
});

describe("formatShortDate", () => {
  it("formats Date object as MM/DD", () => {
    const date = new Date(Date.UTC(2026, 2, 9));
    expect(formatShortDate(date)).toBe("03/09");
  });

  it("formats ISO string as MM/DD", () => {
    expect(formatShortDate("2026-03-09T00:00:00.000Z")).toBe("03/09");
  });

  it("formats date with single-digit day/month with leading zero", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    expect(formatShortDate(date)).toBe("01/05");
  });
});

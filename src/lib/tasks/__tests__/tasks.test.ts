import { describe, it, expect } from "vitest";
import { startOfDay, startOfNextDay } from "../queries";

describe("startOfDay", () => {
  it("zeroes hours, minutes, seconds, ms", () => {
    const d = startOfDay(new Date("2026-03-09T15:30:45.123Z"));
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });

  it("does not mutate original date", () => {
    const original = new Date("2026-03-09T15:30:00Z");
    startOfDay(original);
    expect(original.getUTCHours()).toBe(15);
  });
});

describe("startOfNextDay", () => {
  it("returns next day at midnight", () => {
    const d = startOfNextDay(new Date("2026-03-09T15:30:00Z"));
    expect(d.getUTCDate()).toBe(10);
    expect(d.getUTCHours()).toBe(0);
  });

  it("handles month boundary", () => {
    const d = startOfNextDay(new Date("2026-03-31T12:00:00Z"));
    expect(d.getUTCMonth()).toBe(3); // April (0-indexed)
    expect(d.getUTCDate()).toBe(1);
  });
});

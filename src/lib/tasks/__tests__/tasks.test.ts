import { describe, it, expect } from "vitest";
import { startOfDay, startOfNextDay } from "../queries";

describe("startOfDay", () => {
  it("zeroes hours, minutes, seconds, ms", () => {
    const d = startOfDay(new Date("2026-03-09T15:30:45.123"));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it("does not mutate original date", () => {
    const original = new Date("2026-03-09T15:30:00");
    startOfDay(original);
    expect(original.getHours()).toBe(15);
  });
});

describe("startOfNextDay", () => {
  it("returns next day at midnight", () => {
    const d = startOfNextDay(new Date("2026-03-09T15:30:00"));
    expect(d.getDate()).toBe(10);
    expect(d.getHours()).toBe(0);
  });

  it("handles month boundary", () => {
    const d = startOfNextDay(new Date("2026-03-31T12:00:00"));
    expect(d.getMonth()).toBe(3); // April (0-indexed)
    expect(d.getDate()).toBe(1);
  });
});

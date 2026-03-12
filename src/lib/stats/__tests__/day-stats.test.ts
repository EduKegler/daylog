import { describe, it, expect } from "vitest";
import { computeDayStats } from "../day-stats";

describe("computeDayStats", () => {
  it("returns zeros for empty list", () => {
    const stats = computeDayStats([]);
    expect(stats).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      completionRate: 0,
    });
  });

  it("counts completed and pending correctly", () => {
    const tasks = [
      { status: "COMPLETED" as const },
      { status: "PENDING" as const },
      { status: "PENDING" as const },
      { status: "COMPLETED" as const },
    ];
    const stats = computeDayStats(tasks);
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.completionRate).toBe(0.5);
  });

  it("handles all completed", () => {
    const tasks = [
      { status: "COMPLETED" as const },
      { status: "COMPLETED" as const },
    ];
    const stats = computeDayStats(tasks);
    expect(stats.completionRate).toBe(1);
  });

  it("handles all pending", () => {
    const tasks = [
      { status: "PENDING" as const },
      { status: "PENDING" as const },
    ];
    const stats = computeDayStats(tasks);
    expect(stats.completionRate).toBe(0);
    expect(stats.pending).toBe(2);
  });

  it("excludes SKIPPED from pending count but includes in total", () => {
    const tasks = [
      { status: "COMPLETED" as const },
      { status: "SKIPPED" as const },
      { status: "PENDING" as const },
    ];
    const stats = computeDayStats(tasks);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.completionRate).toBeCloseTo(1 / 3);
  });

  it("includes DISMISSED in total but not in completed or pending", () => {
    const tasks = [
      { status: "COMPLETED" as const },
      { status: "DISMISSED" as const },
      { status: "PENDING" as const },
    ];
    const stats = computeDayStats(tasks);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.completionRate).toBeCloseTo(1 / 3);
  });
});

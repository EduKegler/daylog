import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OwnerFilter } from "@/lib/auth/owner-context";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    create: vi.fn().mockResolvedValue({}),
  },
  $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
    await fn(mockPrisma);
  }),
}));

const mockQueries = vi.hoisted(() => ({
  getActiveRecurringTasks: vi.fn(),
  getExistingDailyTaskRecurringIds: vi.fn(),
  startOfDay: vi.fn((d: Date) => {
    const copy = new Date(d);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
  }),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../queries", () => mockQueries);

import { ensureRecurringInstances } from "../ensure-recurring-instances";

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

const userFilter: OwnerFilter = { userId: "user1" };

const baseRecurring = {
  userId: "user1",
  description: null,
  tags: [],
  isActive: true,
  recurrenceConfig: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ensureRecurringInstances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not create anything when there are no active recurring tasks", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not duplicate when recurring task was already generated today", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Daily", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set(["rt1"]));

    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates instance for recurring task that should occur today", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Daily Task", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user1",
        sourceType: "RECURRING",
        recurringTaskId: "rt1",
        title: "Daily Task",
        tags: { connect: [] },
      }),
    });
  });

  it("creates instance with guestSessionId for guest", async () => {
    const guestFilter: OwnerFilter = { guestSessionId: "guest-1" };
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Guest Daily", recurrenceType: "DAILY", userId: null, guestSessionId: "guest-1" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances(guestFilter, utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guestSessionId: "guest-1",
        sourceType: "RECURRING",
        recurringTaskId: "rt1",
        title: "Guest Daily",
      }),
    });
  });

  it("does not create WEEKDAYS on Saturday", async () => {
    // 2026-03-14 = Saturday
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Weekday Task", recurrenceType: "WEEKDAYS" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 14));

    expect(mockPrisma.dailyTask.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates only new ones when some already exist", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Task 1", recurrenceType: "DAILY" },
      { ...baseRecurring, id: "rt2", title: "Task 2", recurrenceType: "DAILY" },
      { ...baseRecurring, id: "rt3", title: "Task 3", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set(["rt2"]));

    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledTimes(2);
    const calls = mockPrisma.dailyTask.create.mock.calls;
    expect(calls.map((c: [{ data: { recurringTaskId: string } }]) => c[0].data.recurringTaskId)).toEqual(["rt1", "rt3"]);
  });

  it("creates SPECIFIC_WEEKDAYS only on the correct days", async () => {
    const config = JSON.stringify({ days: [1, 3, 5] });
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "MWF", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    // 2026-03-09 = Monday (day 1) → should create
    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 9));
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledTimes(1);
  });

  it("does not create SPECIFIC_WEEKDAYS on a non-included day", async () => {
    const config = JSON.stringify({ days: [1, 3, 5] });
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "MWF", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    // 2026-03-10 = Tuesday (day 2) → should not create
    await ensureRecurringInstances(userFilter, utcDate(2026, 3, 10));
    expect(mockPrisma.dailyTask.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

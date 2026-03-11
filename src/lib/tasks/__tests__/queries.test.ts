import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  recurringTask: {
    findMany: vi.fn(),
  },
  dailyTask: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import {
  getUserDayState,
  getRecurringTasks,
  getActiveRecurringTasks,
  getDailyTasksForDate,
  getExistingDailyTaskRecurringIds,
  startOfDay,
  startOfNextDay,
} from "../queries";

describe("getUserDayState", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns timezone and lastProcessedDate", async () => {
    const lastProcessed = new Date("2026-03-10T00:00:00Z");
    mockPrisma.user.findUnique.mockResolvedValue({
      timezone: "America/Sao_Paulo",
      lastProcessedDate: lastProcessed,
    });

    const result = await getUserDayState("user-1");

    expect(result).toEqual({
      timezone: "America/Sao_Paulo",
      lastProcessedDate: lastProcessed,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { timezone: true, lastProcessedDate: true },
    });
  });

  it("throws 'User not found' when user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getUserDayState("nonexistent")).rejects.toThrow(
      "User not found: nonexistent",
    );
  });
});

describe("getRecurringTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany with userId and correct orderBy", async () => {
    mockPrisma.recurringTask.findMany.mockResolvedValue([]);

    await getRecurringTasks("user-1");

    expect(mockPrisma.recurringTask.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  });
});

describe("getActiveRecurringTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters only active tasks", async () => {
    mockPrisma.recurringTask.findMany.mockResolvedValue([]);

    await getActiveRecurringTasks("user-1");

    expect(mockPrisma.recurringTask.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isActive: true },
    });
  });
});

describe("getDailyTasksForDate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses startOfDay/startOfNextDay range and includes recurringTask", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);

    const date = new Date("2026-03-11T15:00:00Z");
    await getDailyTasksForDate("user-1", date);

    const expectedStart = startOfDay(date);
    const expectedEnd = startOfNextDay(date);

    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        scheduledDate: { gte: expectedStart, lt: expectedEnd },
      },
      include: {
        recurringTask: {
          select: { id: true, recurrenceType: true, recurrenceConfig: true },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
  });
});

describe("getExistingDailyTaskRecurringIds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Set of recurringTaskIds", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { recurringTaskId: "rec-1" },
      { recurringTaskId: "rec-2" },
    ]);

    const date = new Date("2026-03-11T10:00:00Z");
    const result = await getExistingDailyTaskRecurringIds("user-1", date);

    expect(result).toBeInstanceOf(Set);
    expect(result).toEqual(new Set(["rec-1", "rec-2"]));
  });

  it("filters by RECURRING sourceType", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);

    const date = new Date("2026-03-11T10:00:00Z");
    await getExistingDailyTaskRecurringIds("user-1", date);

    const expectedStart = startOfDay(date);
    const expectedEnd = startOfNextDay(date);

    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        scheduledDate: { gte: expectedStart, lt: expectedEnd },
        sourceType: "RECURRING",
        recurringTaskId: { not: null },
      },
      select: { recurringTaskId: true },
    });
  });
});

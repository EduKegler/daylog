import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  guestSession: {
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
  getOwnerDayState,
  getRecurringTasks,
  getActiveRecurringTasks,
  getDailyTasksForDate,
  getExistingDailyTaskRecurringIds,
  startOfDay,
  startOfNextDay,
} from "../queries";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";

const userFilter: OwnerFilter = { userId: "user-1" };
const guestFilter: OwnerFilter = { guestSessionId: "guest-1" };

describe("getOwnerDayState", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns timezone and lastProcessedDate for user", async () => {
    const lastProcessed = new Date("2026-03-10T00:00:00Z");
    mockPrisma.user.findUnique.mockResolvedValue({
      timezone: "America/Sao_Paulo",
      lastProcessedDate: lastProcessed,
    });

    const ctx: OwnerContext = { type: "user", userId: "user-1", timezone: "America/Sao_Paulo" };
    const result = await getOwnerDayState(ctx);

    expect(result).toEqual({
      timezone: "America/Sao_Paulo",
      lastProcessedDate: lastProcessed,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { timezone: true, lastProcessedDate: true },
    });
  });

  it("returns timezone and lastProcessedDate for guest", async () => {
    mockPrisma.guestSession.findUnique.mockResolvedValue({
      timezone: "Europe/London",
      lastProcessedDate: null,
    });

    const ctx: OwnerContext = { type: "guest", guestSessionId: "guest-1", timezone: "Europe/London" };
    const result = await getOwnerDayState(ctx);

    expect(result).toEqual({
      timezone: "Europe/London",
      lastProcessedDate: null,
    });
  });

  it("throws 'User not found' when user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const ctx: OwnerContext = { type: "user", userId: "nonexistent", timezone: "UTC" };

    await expect(getOwnerDayState(ctx)).rejects.toThrow("User not found: nonexistent");
  });

  it("throws when guest session does not exist", async () => {
    mockPrisma.guestSession.findUnique.mockResolvedValue(null);
    const ctx: OwnerContext = { type: "guest", guestSessionId: "bad-id", timezone: "UTC" };

    await expect(getOwnerDayState(ctx)).rejects.toThrow("Guest session not found: bad-id");
  });
});

describe("getRecurringTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany with userId filter and correct orderBy", async () => {
    mockPrisma.recurringTask.findMany.mockResolvedValue([]);

    await getRecurringTasks(userFilter);

    expect(mockPrisma.recurringTask.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  });

  it("calls findMany with guestSessionId filter", async () => {
    mockPrisma.recurringTask.findMany.mockResolvedValue([]);

    await getRecurringTasks(guestFilter);

    expect(mockPrisma.recurringTask.findMany).toHaveBeenCalledWith({
      where: { guestSessionId: "guest-1" },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  });
});

describe("getActiveRecurringTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters only active tasks", async () => {
    mockPrisma.recurringTask.findMany.mockResolvedValue([]);

    await getActiveRecurringTasks(userFilter);

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
    await getDailyTasksForDate(userFilter, date);

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
    const result = await getExistingDailyTaskRecurringIds(userFilter, date);

    expect(result).toBeInstanceOf(Set);
    expect(result).toEqual(new Set(["rec-1", "rec-2"]));
  });

  it("filters by RECURRING sourceType", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);

    const date = new Date("2026-03-11T10:00:00Z");
    await getExistingDailyTaskRecurringIds(userFilter, date);

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

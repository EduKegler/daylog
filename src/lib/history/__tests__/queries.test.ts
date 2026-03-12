import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OwnerFilter } from "@/lib/auth/owner-context";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { getHistory } from "../queries";

const today = new Date("2026-03-09T00:00:00.000Z");
const yesterday = new Date("2026-03-08T00:00:00.000Z");
const twoDaysAgo = new Date("2026-03-07T00:00:00.000Z");
const threeDaysAgo = new Date("2026-03-06T00:00:00.000Z");

const userFilter: OwnerFilter = { userId: "user-1" };

describe("getHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no tasks: returns empty", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    const result = await getHistory(userFilter, today, 0, 7);

    expect(result).toEqual({ days: [], hasMore: false });
  });

  it("days with tasks: correctly grouped with stats", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
      { scheduledDate: twoDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "t1",
        userId: "user-1",
        title: "Task 1",
        status: "COMPLETED",
        scheduledDate: yesterday,
        sourceType: "MANUAL",
        tags: [],
      },
      {
        id: "t2",
        userId: "user-1",
        title: "Task 2",
        status: "PENDING",
        scheduledDate: yesterday,
        sourceType: "RECURRING",
        tags: [],
      },
      {
        id: "t3",
        userId: "user-1",
        title: "Task 3",
        status: "COMPLETED",
        scheduledDate: twoDaysAgo,
        sourceType: "MANUAL",
        tags: [],
      },
    ]);

    const result = await getHistory(userFilter, today, 0, 7);

    expect(result.days).toHaveLength(2);
    expect(result.hasMore).toBe(false);

    expect(result.days[0].date).toEqual(yesterday);
    expect(result.days[0].tasks).toHaveLength(2);
    expect(result.days[0].stats.total).toBe(2);
    expect(result.days[0].stats.completed).toBe(1);
    expect(result.days[0].stats.pending).toBe(1);

    expect(result.days[1].date).toEqual(twoDaysAgo);
    expect(result.days[1].tasks).toHaveLength(1);
    expect(result.days[1].stats.total).toBe(1);
    expect(result.days[1].stats.completed).toBe(1);
  });

  it("pagination: page 0 with hasMore = true", async () => {
    // pageSize=2, returns 3 (take: pageSize+1) → hasMore = true
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
      { scheduledDate: twoDaysAgo },
      { scheduledDate: threeDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "t1", status: "PENDING", scheduledDate: yesterday, tags: [] },
      { id: "t2", status: "COMPLETED", scheduledDate: twoDaysAgo, tags: [] },
    ]);

    const result = await getHistory(userFilter, today, 0, 2);

    expect(result.days).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.days[0].date).toEqual(yesterday);
    expect(result.days[1].date).toEqual(twoDaysAgo);
  });

  it("pagination: page 1 returns next page", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: threeDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "t3", status: "PENDING", scheduledDate: threeDaysAgo, tags: [] },
    ]);

    const result = await getHistory(userFilter, today, 1, 2);

    expect(result.days).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.days[0].date).toEqual(threeDaysAgo);
  });

  it("excludes current day and DISMISSED tasks: groupBy filters by lt beforeDate", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    await getHistory(userFilter, today, 0, 7);

    expect(mockPrisma.dailyTask.groupBy).toHaveBeenCalledWith({
      by: ["scheduledDate"],
      where: {
        userId: "user-1",
        scheduledDate: { lt: today },
        status: { not: "DISMISSED" },
      },
      orderBy: { scheduledDate: "desc" },
      skip: 0,
      take: 8,
    });
  });

  it("excludes DISMISSED tasks from findMany", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);

    await getHistory(userFilter, today, 0, 7);

    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "DISMISSED" },
        }),
      }),
    );
  });

  it("date with no matching tasks: returns empty task list and zero stats", async () => {
    // groupBy returns a date, but findMany has no tasks for it (e.g. deleted between queries)
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
      { scheduledDate: twoDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "t1", status: "COMPLETED", scheduledDate: yesterday, tags: [] },
    ]);

    const result = await getHistory(userFilter, today, 0, 7);

    expect(result.days).toHaveLength(2);
    expect(result.days[1].date).toEqual(twoDaysAgo);
    expect(result.days[1].tasks).toHaveLength(0);
    expect(result.days[1].stats.total).toBe(0);
    expect(result.days[1].stats.completed).toBe(0);
  });

  it("ownership: filters by userId", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    await getHistory({ userId: "user-42" }, today, 0, 7);

    expect(mockPrisma.dailyTask.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-42" }),
      }),
    );
  });

  it("ownership: filters by guestSessionId", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    await getHistory({ guestSessionId: "guest-1" }, today, 0, 7);

    expect(mockPrisma.dailyTask.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ guestSessionId: "guest-1" }),
      }),
    );
  });
});

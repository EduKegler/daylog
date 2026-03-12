import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTx = vi.hoisted(() => ({
  dailyTask: { updateMany: vi.fn() },
  recurringTask: { updateMany: vi.fn() },
  tag: {
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  guestSession: { delete: vi.fn() },
  $executeRaw: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { claimGuestData } from "../claim";

describe("claimGuestData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.tag.findMany.mockResolvedValue([]);
    mockTx.tag.update.mockResolvedValue({});
    mockTx.tag.delete.mockResolvedValue({});
    mockTx.$executeRaw.mockResolvedValue(0);
  });

  it("transfers daily tasks, recurring tasks, and deletes guest session", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 3 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 2 });
    mockTx.guestSession.delete.mockResolvedValue({});

    const result = await claimGuestData("guest-1", "user-1");

    expect(result).toEqual({ claimedDailyTasks: 3, claimedRecurringTasks: 2 });

    expect(mockTx.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { guestSessionId: "guest-1" },
      data: { userId: "user-1", guestSessionId: null },
    });

    expect(mockTx.recurringTask.updateMany).toHaveBeenCalledWith({
      where: { guestSessionId: "guest-1" },
      data: { userId: "user-1", guestSessionId: null },
    });

    expect(mockTx.guestSession.delete).toHaveBeenCalledWith({
      where: { id: "guest-1" },
    });
  });

  it("returns zero counts when guest has no data", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.guestSession.delete.mockResolvedValue({});

    const result = await claimGuestData("empty-guest", "user-1");

    expect(result).toEqual({ claimedDailyTasks: 0, claimedRecurringTasks: 0 });
  });

  it("runs all operations in a single transaction", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 1 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.guestSession.delete.mockResolvedValue({});

    await claimGuestData("guest-1", "user-1");

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("transfers tags with no name collision", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.guestSession.delete.mockResolvedValue({});
    mockTx.tag.findMany
      .mockResolvedValueOnce([{ id: "gt1", name: "work", guestSessionId: "guest-1", userId: null }])
      .mockResolvedValueOnce([]);

    await claimGuestData("guest-1", "user-1");

    expect(mockTx.tag.update).toHaveBeenCalledWith({
      where: { id: "gt1" },
      data: { guestSessionId: null, userId: "user-1" },
    });
    expect(mockTx.$executeRaw).not.toHaveBeenCalled();
    expect(mockTx.tag.delete).not.toHaveBeenCalled();
  });

  it("merges tags with name collision (case-insensitive)", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.guestSession.delete.mockResolvedValue({});
    mockTx.tag.findMany
      .mockResolvedValueOnce([{ id: "gt1", name: "Work", guestSessionId: "guest-1", userId: null }])
      .mockResolvedValueOnce([{ id: "ut1", name: "work", guestSessionId: null, userId: "user-1" }]);

    await claimGuestData("guest-1", "user-1");

    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(mockTx.tag.delete).toHaveBeenCalledWith({ where: { id: "gt1" } });
    expect(mockTx.tag.update).not.toHaveBeenCalled();
  });

  it("handles mixed transfer and merge", async () => {
    mockTx.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.recurringTask.updateMany.mockResolvedValue({ count: 0 });
    mockTx.guestSession.delete.mockResolvedValue({});
    mockTx.tag.findMany
      .mockResolvedValueOnce([
        { id: "gt1", name: "work", guestSessionId: "guest-1", userId: null },
        { id: "gt2", name: "personal", guestSessionId: "guest-1", userId: null },
      ])
      .mockResolvedValueOnce([
        { id: "ut1", name: "work", guestSessionId: null, userId: "user-1" },
      ]);

    await claimGuestData("guest-1", "user-1");

    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(mockTx.tag.delete).toHaveBeenCalledWith({ where: { id: "gt1" } });
    expect(mockTx.tag.update).toHaveBeenCalledWith({
      where: { id: "gt2" },
      data: { guestSessionId: null, userId: "user-1" },
    });
  });
});

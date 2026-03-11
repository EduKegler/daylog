import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTx = vi.hoisted(() => ({
  dailyTask: { updateMany: vi.fn() },
  recurringTask: { updateMany: vi.fn() },
  guestSession: { delete: vi.fn() },
}));

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { claimGuestData } from "../claim";

describe("claimGuestData", () => {
  beforeEach(() => vi.clearAllMocks());

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
});

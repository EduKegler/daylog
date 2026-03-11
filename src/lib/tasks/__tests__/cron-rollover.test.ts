import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OwnerContext } from "@/lib/auth/owner-context";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
  },
}));

const mockProcessRollover = vi.hoisted(() => vi.fn());
const mockEnsureRecurringInstances = vi.hoisted(() => vi.fn());
const mockGetUserLocalDate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/tasks/rollover", () => ({
  processRollover: mockProcessRollover,
}));
vi.mock("@/lib/tasks/ensure-recurring-instances", () => ({
  ensureRecurringInstances: mockEnsureRecurringInstances,
}));
vi.mock("@/lib/tasks/generation", () => ({
  getUserLocalDate: mockGetUserLocalDate,
}));

import { processCronRollover } from "../cron-rollover";

const today = new Date("2026-03-09T00:00:00.000Z");
const yesterday = new Date("2026-03-08T00:00:00.000Z");

function userCtx(id: string, timezone: string): OwnerContext {
  return { type: "user", userId: id, timezone };
}

describe("processCronRollover", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no users → processed 0, empty results", async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await processCronRollover();

    expect(result).toEqual({ processed: 0, results: [] });
    expect(mockProcessRollover).not.toHaveBeenCalled();
    expect(mockEnsureRecurringInstances).not.toHaveBeenCalled();
  });

  it("user with lastProcessedDate < today → calls rollover + recurring", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "America/Sao_Paulo", lastProcessedDate: yesterday },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);
    mockProcessRollover.mockResolvedValue({ carriedOver: 3 });
    mockEnsureRecurringInstances.mockResolvedValue(undefined);

    const result = await processCronRollover();

    expect(result).toEqual({
      processed: 1,
      results: [{ userId: "user-1", carriedOver: 3 }],
    });
    expect(mockProcessRollover).toHaveBeenCalledWith(
      userCtx("user-1", "America/Sao_Paulo"),
      yesterday,
      today,
    );
    expect(mockEnsureRecurringInstances).toHaveBeenCalledWith(
      { userId: "user-1" },
      today,
    );
  });

  it("user with lastProcessedDate == today → skips (already processed)", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "America/Sao_Paulo", lastProcessedDate: today },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);

    const result = await processCronRollover();

    expect(result).toEqual({ processed: 0, results: [] });
    expect(mockProcessRollover).not.toHaveBeenCalled();
    expect(mockEnsureRecurringInstances).not.toHaveBeenCalled();
  });

  it("user with lastProcessedDate = null → calls rollover (first access)", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "UTC", lastProcessedDate: null },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);
    mockProcessRollover.mockResolvedValue({ carriedOver: 0 });
    mockEnsureRecurringInstances.mockResolvedValue(undefined);

    const result = await processCronRollover();

    expect(result).toEqual({
      processed: 1,
      results: [{ userId: "user-1", carriedOver: 0 }],
    });
    expect(mockProcessRollover).toHaveBeenCalledWith(
      userCtx("user-1", "UTC"),
      null,
      today,
    );
    expect(mockEnsureRecurringInstances).toHaveBeenCalledWith(
      { userId: "user-1" },
      today,
    );
  });

  it("multiple users, different states → processes only those that need it", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "UTC", lastProcessedDate: yesterday },
      { id: "user-2", timezone: "UTC", lastProcessedDate: today },
      { id: "user-3", timezone: "UTC", lastProcessedDate: null },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);
    mockProcessRollover
      .mockResolvedValueOnce({ carriedOver: 2 })
      .mockResolvedValueOnce({ carriedOver: 0 });
    mockEnsureRecurringInstances.mockResolvedValue(undefined);

    const result = await processCronRollover();

    expect(result).toEqual({
      processed: 2,
      results: [
        { userId: "user-1", carriedOver: 2 },
        { userId: "user-3", carriedOver: 0 },
      ],
    });
    // user-2 was skipped
    expect(mockProcessRollover).toHaveBeenCalledTimes(2);
    expect(mockEnsureRecurringInstances).toHaveBeenCalledTimes(2);
  });

  it("multiple timezones → getUserLocalDate returns different dates, selective processing", async () => {
    const todayForBrazil = new Date("2026-03-09T00:00:00.000Z");
    const todayForJapan = new Date("2026-03-10T00:00:00.000Z");
    const march9 = new Date("2026-03-09T00:00:00.000Z");

    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-br", timezone: "America/Sao_Paulo", lastProcessedDate: march9 },
      { id: "user-jp", timezone: "Asia/Tokyo", lastProcessedDate: march9 },
    ]);
    mockGetUserLocalDate
      .mockReturnValueOnce(todayForBrazil) // Brazil: same as lastProcessedDate → skip
      .mockReturnValueOnce(todayForJapan); // Japan: already March 10 → process
    mockProcessRollover.mockResolvedValue({ carriedOver: 1 });
    mockEnsureRecurringInstances.mockResolvedValue(undefined);

    const result = await processCronRollover();

    expect(result).toEqual({
      processed: 1,
      results: [{ userId: "user-jp", carriedOver: 1 }],
    });
    expect(mockGetUserLocalDate).toHaveBeenCalledWith("America/Sao_Paulo");
    expect(mockGetUserLocalDate).toHaveBeenCalledWith("Asia/Tokyo");
  });

  it("order: processRollover runs before ensureRecurringInstances per user", async () => {
    const callOrder: string[] = [];
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "UTC", lastProcessedDate: yesterday },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);
    mockProcessRollover.mockImplementation(async () => {
      callOrder.push("rollover");
      return { carriedOver: 0 };
    });
    mockEnsureRecurringInstances.mockImplementation(async () => {
      callOrder.push("recurring");
    });

    await processCronRollover();

    expect(callOrder).toEqual(["rollover", "recurring"]);
  });

  it("result includes correct carriedOver from processRollover", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user-1", timezone: "UTC", lastProcessedDate: yesterday },
      { id: "user-2", timezone: "UTC", lastProcessedDate: null },
    ]);
    mockGetUserLocalDate.mockReturnValue(today);
    mockProcessRollover
      .mockResolvedValueOnce({ carriedOver: 5 })
      .mockResolvedValueOnce({ carriedOver: 0 });
    mockEnsureRecurringInstances.mockResolvedValue(undefined);

    const result = await processCronRollover();

    expect(result.results[0].carriedOver).toBe(5);
    expect(result.results[1].carriedOver).toBe(0);
  });
});

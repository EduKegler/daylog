import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";

const mockPrisma = vi.hoisted(() => ({
  user: {
    update: vi.fn(),
  },
  guestSession: {
    update: vi.fn(),
  },
  dailyTask: {
    findMany: vi.fn(),
    create: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({}),
  },
  $transaction: vi.fn(async (fn: unknown) => {
    if (typeof fn === "function") {
      return fn(mockPrisma);
    }
    return fn;
  }),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth/owner-context", () => ({
  buildOwnerFilter: (ctx: OwnerContext): OwnerFilter => {
    if (ctx.type === "user") return { userId: ctx.userId };
    return { guestSessionId: ctx.guestSessionId };
  },
}));

import { processRollover } from "../rollover";

const today = new Date("2026-03-09T00:00:00.000Z");
const yesterday = new Date("2026-03-08T00:00:00.000Z");
const fiveDaysAgo = new Date("2026-03-04T00:00:00.000Z");

const userCtx: OwnerContext = { type: "user", userId: "user-1", timezone: "UTC" };
const guestCtx: OwnerContext = { type: "guest", guestSessionId: "guest-1", timezone: "UTC" };

describe("processRollover", () => {
  beforeEach(() => vi.clearAllMocks());

  it("first access: sets lastProcessedDate, carriedOver = 0", async () => {
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover(userCtx, null, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { lastProcessedDate: today },
    });
  });

  it("first access for guest: sets lastProcessedDate on guest session", async () => {
    mockPrisma.guestSession.update.mockResolvedValue({});

    const result = await processRollover(guestCtx, null, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.guestSession.update).toHaveBeenCalledWith({
      where: { id: "guest-1" },
      data: { lastProcessedDate: today },
    });
  });

  it("same day: no-op, carriedOver = 0", async () => {
    const result = await processRollover(userCtx, today, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.dailyTask.findMany).not.toHaveBeenCalled();
  });

  it("normal day — pending manual task: creates carry-over and marks SKIPPED", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Buy coffee",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
        tags: [],
      },
    ]);

    const result = await processRollover(userCtx, yesterday, today);

    expect(result).toEqual({ carriedOver: 1 });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

    // Verify create args
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Buy coffee",
        description: null,
        scheduledDate: today,
        originalDate: yesterday,
        tags: { connect: [] },
      },
    });

    // Verify updateMany args
    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["task-1"] } },
      data: { status: "SKIPPED" },
    });
  });

  it("normal day — completed manual task: nothing carried over", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover(userCtx, yesterday, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("normal day — pending recurring task: nothing carried over", async () => {
    // Pending recurring tasks are not fetched (sourceType=MANUAL filter)
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover(userCtx, yesterday, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        scheduledDate: yesterday,
        sourceType: "MANUAL",
        status: "PENDING",
      },
      include: { tags: { select: { id: true } } },
    });
  });

  it("idempotency: second execution carries nothing", async () => {
    // On second execution, lastProcessedDate is already today
    const result = await processRollover(userCtx, today, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.dailyTask.findMany).not.toHaveBeenCalled();
  });

  it("multi-day gap: carries tasks from lastProcessedDate", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Old task 1",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: fiveDaysAgo,
        originalDate: null,
        tags: [],
      },
      {
        id: "task-2",
        userId: "user-1",
        title: "Old task 2",
        description: "Desc",
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: fiveDaysAgo,
        originalDate: null,
        tags: [],
      },
    ]);

    const result = await processRollover(userCtx, fiveDaysAgo, today);

    expect(result).toEqual({ carriedOver: 2 });
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.dailyTask.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        scheduledDate: today,
        originalDate: fiveDaysAgo,
      }),
    });
    expect(mockPrisma.dailyTask.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        scheduledDate: today,
        originalDate: fiveDaysAgo,
      }),
    });
  });

  it("preserves originalDate in chain of carry-overs", async () => {
    const monday = new Date("2026-03-02T00:00:00.000Z");
    const wednesday = new Date("2026-03-04T00:00:00.000Z");
    const friday = new Date("2026-03-06T00:00:00.000Z");

    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-chain",
        userId: "user-1",
        title: "Chained task",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: wednesday,
        originalDate: monday, // already carried from Monday to Wednesday
        tags: [],
      },
    ]);

    const result = await processRollover(userCtx, wednesday, friday);

    expect(result).toEqual({ carriedOver: 1 });
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originalDate: monday, // preserves the original
        scheduledDate: friday,
      }),
    });
  });

  it("mixed tasks: only pending manual tasks are carried over", async () => {
    // The findMany mock only returns MANUAL+PENDING (Prisma filter)
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "manual-pending-1",
        userId: "user-1",
        title: "Manual Pending 1",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
        tags: [],
      },
      {
        id: "manual-pending-2",
        userId: "user-1",
        title: "Manual Pending 2",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
        tags: [],
      },
    ]);

    const result = await processRollover(userCtx, yesterday, today);

    expect(result).toEqual({ carriedOver: 2 });
  });

  it("atomic transaction: all operations inside $transaction", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Task",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
        tags: [],
      },
    ]);

    await processRollover(userCtx, yesterday, today);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    // Verify that create, updateMany and user.update were called (inside the transaction fn)
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("guest rollover: uses guestSessionId in filter and updates guest session", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-g1",
        guestSessionId: "guest-1",
        title: "Guest task",
        description: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
        tags: [],
      },
    ]);

    const result = await processRollover(guestCtx, yesterday, today);

    expect(result).toEqual({ carriedOver: 1 });

    // Verify filter uses guestSessionId
    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith({
      where: {
        guestSessionId: "guest-1",
        scheduledDate: yesterday,
        sourceType: "MANUAL",
        status: "PENDING",
      },
      include: { tags: { select: { id: true } } },
    });

    // Verify carry-over data uses guestSessionId
    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guestSessionId: "guest-1",
      }),
    });
    const createCall = mockPrisma.dailyTask.create.mock.calls[0][0];
    expect(createCall.data.userId).toBeUndefined();

    // Verify lastProcessedDate updates guest session
    expect(mockPrisma.guestSession.update).toHaveBeenCalledWith({
      where: { id: "guest-1" },
      data: { lastProcessedDate: today },
    });
  });
});

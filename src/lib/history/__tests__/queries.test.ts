import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("getHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sem tarefas: retorna vazio", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    const result = await getHistory("user-1", today, 0, 7);

    expect(result).toEqual({ days: [], hasMore: false });
  });

  it("dias com tarefas: agrupados corretamente com stats", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
      { scheduledDate: twoDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "t1",
        userId: "user-1",
        title: "Tarefa 1",
        status: "COMPLETED",
        scheduledDate: yesterday,
        sourceType: "MANUAL",
      },
      {
        id: "t2",
        userId: "user-1",
        title: "Tarefa 2",
        status: "PENDING",
        scheduledDate: yesterday,
        sourceType: "RECURRING",
      },
      {
        id: "t3",
        userId: "user-1",
        title: "Tarefa 3",
        status: "COMPLETED",
        scheduledDate: twoDaysAgo,
        sourceType: "MANUAL",
      },
    ]);

    const result = await getHistory("user-1", today, 0, 7);

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

  it("paginação: page 0 com hasMore = true", async () => {
    // pageSize=2, retorna 3 (take: pageSize+1) → hasMore = true
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: yesterday },
      { scheduledDate: twoDaysAgo },
      { scheduledDate: threeDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "t1", status: "PENDING", scheduledDate: yesterday },
      { id: "t2", status: "COMPLETED", scheduledDate: twoDaysAgo },
    ]);

    const result = await getHistory("user-1", today, 0, 2);

    expect(result.days).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.days[0].date).toEqual(yesterday);
    expect(result.days[1].date).toEqual(twoDaysAgo);
  });

  it("paginação: page 1 retorna próxima página", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([
      { scheduledDate: threeDaysAgo },
    ]);
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "t3", status: "PENDING", scheduledDate: threeDaysAgo },
    ]);

    const result = await getHistory("user-1", today, 1, 2);

    expect(result.days).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.days[0].date).toEqual(threeDaysAgo);
  });

  it("exclui dia atual: groupBy filtra por lt beforeDate", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    await getHistory("user-1", today, 0, 7);

    expect(mockPrisma.dailyTask.groupBy).toHaveBeenCalledWith({
      by: ["scheduledDate"],
      where: {
        userId: "user-1",
        scheduledDate: { lt: today },
      },
      orderBy: { scheduledDate: "desc" },
      skip: 0,
      take: 8,
    });
  });

  it("ownership: filtra por userId", async () => {
    mockPrisma.dailyTask.groupBy.mockResolvedValue([]);

    await getHistory("user-42", today, 0, 7);

    expect(mockPrisma.dailyTask.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-42" }),
      }),
    );
  });
});

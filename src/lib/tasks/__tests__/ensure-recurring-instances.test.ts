import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
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

const baseRecurring = {
  userId: "user1",
  description: null,
  category: null,
  isActive: true,
  recurrenceConfig: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ensureRecurringInstances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não cria nada quando não há recorrentes ativas", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances("user1", utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.createMany).not.toHaveBeenCalled();
  });

  it("não duplica quando recorrente já foi gerada hoje", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Daily", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set(["rt1"]));

    await ensureRecurringInstances("user1", utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.createMany).not.toHaveBeenCalled();
  });

  it("cria instância para recorrente que deve ocorrer hoje", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Daily Task", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances("user1", utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "user1",
          sourceType: "RECURRING",
          recurringTaskId: "rt1",
          title: "Daily Task",
        }),
      ],
    });
  });

  it("não cria WEEKDAYS em sábado", async () => {
    // 2026-03-14 = Sábado
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Weekday Task", recurrenceType: "WEEKDAYS" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    await ensureRecurringInstances("user1", utcDate(2026, 3, 14));

    expect(mockPrisma.dailyTask.createMany).not.toHaveBeenCalled();
  });

  it("cria apenas as novas quando algumas já existem", async () => {
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "Task 1", recurrenceType: "DAILY" },
      { ...baseRecurring, id: "rt2", title: "Task 2", recurrenceType: "DAILY" },
      { ...baseRecurring, id: "rt3", title: "Task 3", recurrenceType: "DAILY" },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set(["rt2"]));

    await ensureRecurringInstances("user1", utcDate(2026, 3, 9));

    expect(mockPrisma.dailyTask.createMany).toHaveBeenCalledTimes(1);
    const call = mockPrisma.dailyTask.createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(2);
    expect(call.data.map((d: { recurringTaskId: string }) => d.recurringTaskId)).toEqual(["rt1", "rt3"]);
  });

  it("cria SPECIFIC_WEEKDAYS apenas nos dias corretos", async () => {
    const config = JSON.stringify({ days: [1, 3, 5] });
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "MWF", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    // 2026-03-09 = Segunda (day 1) → deve criar
    await ensureRecurringInstances("user1", utcDate(2026, 3, 9));
    expect(mockPrisma.dailyTask.createMany).toHaveBeenCalledTimes(1);
  });

  it("não cria SPECIFIC_WEEKDAYS em dia não incluído", async () => {
    const config = JSON.stringify({ days: [1, 3, 5] });
    mockQueries.getActiveRecurringTasks.mockResolvedValue([
      { ...baseRecurring, id: "rt1", title: "MWF", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);
    mockQueries.getExistingDailyTaskRecurringIds.mockResolvedValue(new Set());

    // 2026-03-10 = Terça (day 2) → não cria
    await ensureRecurringInstances("user1", utcDate(2026, 3, 10));
    expect(mockPrisma.dailyTask.createMany).not.toHaveBeenCalled();
  });
});

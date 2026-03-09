import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma";
import { generateDailyTasks, getUserLocalDate } from "../generation";

// Helper: cria Date UTC
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function createMockPrisma(
  recurringTasks: Array<{
    id: string;
    userId: string;
    title: string;
    description: string | null;
    category: string | null;
    recurrenceType: string;
    recurrenceConfig: string | null;
    isActive: boolean;
  }>,
  existingDailyTasks: Array<{ recurringTaskId: string | null }> = [],
) {
  const mock = {
    recurringTask: {
      findMany: vi.fn().mockResolvedValue(recurringTasks),
    },
    dailyTask: {
      findMany: vi.fn().mockResolvedValue(existingDailyTasks),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return mock as typeof mock & PrismaClient;
}

const baseTask = {
  userId: "user1",
  description: null,
  category: null,
  isActive: true,
};

describe("generateDailyTasks", () => {
  it("gera DailyTasks para recorrências aplicáveis", async () => {
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "Daily Task", recurrenceType: "DAILY", recurrenceConfig: null },
    ]);

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(db.dailyTask.createMany).toHaveBeenCalledWith({
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

  it("NÃO gera para recorrências que não se aplicam ao dia", async () => {
    // 2026-03-14 = Sábado
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "Weekday Task", recurrenceType: "WEEKDAYS", recurrenceConfig: null },
    ]);

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 14));

    expect(result.created).toBe(0);
    expect(db.dailyTask.createMany).not.toHaveBeenCalled();
  });

  it("NÃO duplica se já existe", async () => {
    const db = createMockPrisma(
      [{ ...baseTask, id: "rt1", title: "Daily Task", recurrenceType: "DAILY", recurrenceConfig: null }],
      [{ recurringTaskId: "rt1" }],
    );

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(db.dailyTask.createMany).not.toHaveBeenCalled();
  });

  it("gera múltiplas tarefas em batch", async () => {
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "Task 1", recurrenceType: "DAILY", recurrenceConfig: null },
      { ...baseTask, id: "rt2", title: "Task 2", recurrenceType: "DAILY", recurrenceConfig: null },
      { ...baseTask, id: "rt3", title: "Task 3", recurrenceType: "DAILY", recurrenceConfig: null },
    ]);

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(result.created).toBe(3);
    expect(db.dailyTask.createMany).toHaveBeenCalledTimes(1);
    const call = (db.dailyTask.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.data).toHaveLength(3);
  });

  it("respeita ownership (userId no filtro)", async () => {
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "Task", recurrenceType: "DAILY", recurrenceConfig: null },
    ]);

    await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(db.recurringTask.findMany).toHaveBeenCalledWith({
      where: { userId: "user1", isActive: true },
    });
    expect(db.dailyTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user1" }),
      }),
    );
  });

  it("retorna zeros quando não há recorrentes", async () => {
    const db = createMockPrisma([]);

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("gera SPECIFIC_WEEKDAYS apenas nos dias corretos", async () => {
    // Seg, Qua, Sex
    const config = JSON.stringify({ days: [1, 3, 5] });
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "MWF Task", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);

    // 2026-03-09 = Segunda (day 1) → deve gerar
    const result1 = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));
    expect(result1.created).toBe(1);
  });

  it("NÃO gera SPECIFIC_WEEKDAYS em dias não incluídos", async () => {
    const config = JSON.stringify({ days: [1, 3, 5] });
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "MWF Task", recurrenceType: "SPECIFIC_WEEKDAYS", recurrenceConfig: config },
    ]);

    // 2026-03-10 = Terça (day 2) → não gera
    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 10));
    expect(result.created).toBe(0);
  });

  it("gera MONTHLY no dia correto", async () => {
    const config = JSON.stringify({ dayOfMonth: 15 });
    const db = createMockPrisma([
      { ...baseTask, id: "rt1", title: "Monthly Task", recurrenceType: "MONTHLY", recurrenceConfig: config },
    ]);

    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 15));
    expect(result.created).toBe(1);
  });

  it("mistura: gera algumas, pula outras, e skip duplicadas", async () => {
    const db = createMockPrisma(
      [
        { ...baseTask, id: "rt1", title: "Daily", recurrenceType: "DAILY", recurrenceConfig: null },
        { ...baseTask, id: "rt2", title: "Weekdays", recurrenceType: "WEEKDAYS", recurrenceConfig: null },
        { ...baseTask, id: "rt3", title: "Already exists", recurrenceType: "DAILY", recurrenceConfig: null },
      ],
      [{ recurringTaskId: "rt3" }],
    );

    // 2026-03-09 = Segunda
    const result = await generateDailyTasks(db, "user1", utcDate(2026, 3, 9));

    expect(result.created).toBe(2); // rt1 + rt2
    expect(result.skipped).toBe(1); // rt3
  });
});

describe("getUserLocalDate", () => {
  it("retorna uma Date UTC representando a data local", () => {
    const date = getUserLocalDate("America/Sao_Paulo");
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });
});

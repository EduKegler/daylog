import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    update: vi.fn(),
  },
  dailyTask: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { processRollover } from "../rollover";

const today = new Date("2026-03-09T00:00:00.000Z");
const yesterday = new Date("2026-03-08T00:00:00.000Z");
const fiveDaysAgo = new Date("2026-03-04T00:00:00.000Z");

describe("processRollover", () => {
  beforeEach(() => vi.clearAllMocks());

  it("primeiro acesso: seta lastProcessedDate, carriedOver = 0", async () => {
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover("user-1", null, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { lastProcessedDate: today },
    });
  });

  it("mesmo dia: no-op, carriedOver = 0", async () => {
    const result = await processRollover("user-1", today, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.dailyTask.findMany).not.toHaveBeenCalled();
  });

  it("dia normal — manual pendente: cria carry-over e marca SKIPPED", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Comprar café",
        description: null,
        category: "Pessoal",
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
      },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await processRollover("user-1", yesterday, today);

    expect(result).toEqual({ carriedOver: 1 });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    // Verificar args do createMany
    const createManyCall = mockPrisma.dailyTask.createMany.mock.calls[0][0];
    expect(createManyCall.data).toEqual([
      {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Comprar café",
        description: null,
        category: "Pessoal",
        scheduledDate: today,
        originalDate: yesterday, // preserva scheduledDate como originalDate
      },
    ]);

    // Verificar args do updateMany
    const updateManyCall = mockPrisma.dailyTask.updateMany.mock.calls[0][0];
    expect(updateManyCall).toEqual({
      where: { id: { in: ["task-1"] } },
      data: { status: "SKIPPED" },
    });
  });

  it("dia normal — manual concluída: nada carregado", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover("user-1", yesterday, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("dia normal — recorrente pendente: nada carregado", async () => {
    // Recorrentes pendentes não são buscadas (filtro sourceType=MANUAL)
    mockPrisma.dailyTask.findMany.mockResolvedValue([]);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await processRollover("user-1", yesterday, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.dailyTask.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        scheduledDate: yesterday,
        sourceType: "MANUAL",
        status: "PENDING",
      },
    });
  });

  it("idempotência: segunda execução não carrega nada", async () => {
    // Na segunda execução, lastProcessedDate já é today
    const result = await processRollover("user-1", today, today);

    expect(result).toEqual({ carriedOver: 0 });
    expect(mockPrisma.dailyTask.findMany).not.toHaveBeenCalled();
  });

  it("gap multi-dia: carrega tarefas do lastProcessedDate", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Tarefa antiga 1",
        description: null,
        category: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: fiveDaysAgo,
        originalDate: null,
      },
      {
        id: "task-2",
        userId: "user-1",
        title: "Tarefa antiga 2",
        description: "Desc",
        category: "Work",
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: fiveDaysAgo,
        originalDate: null,
      },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await processRollover("user-1", fiveDaysAgo, today);

    expect(result).toEqual({ carriedOver: 2 });

    const createManyCall = mockPrisma.dailyTask.createMany.mock.calls[0][0];
    expect(createManyCall.data[0].scheduledDate).toEqual(today);
    expect(createManyCall.data[0].originalDate).toEqual(fiveDaysAgo);
    expect(createManyCall.data[1].scheduledDate).toEqual(today);
    expect(createManyCall.data[1].originalDate).toEqual(fiveDaysAgo);
  });

  it("preserva originalDate em cadeia de carry-overs", async () => {
    const monday = new Date("2026-03-02T00:00:00.000Z");
    const wednesday = new Date("2026-03-04T00:00:00.000Z");
    const friday = new Date("2026-03-06T00:00:00.000Z");

    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-chain",
        userId: "user-1",
        title: "Tarefa em cadeia",
        description: null,
        category: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: wednesday,
        originalDate: monday, // já foi carregada de segunda para quarta
      },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await processRollover("user-1", wednesday, friday);

    expect(result).toEqual({ carriedOver: 1 });
    const createManyCall = mockPrisma.dailyTask.createMany.mock.calls[0][0];
    expect(createManyCall.data[0].originalDate).toEqual(monday); // preserva a original
    expect(createManyCall.data[0].scheduledDate).toEqual(friday);
  });

  it("múltiplas tarefas mistas: apenas manuais pendentes são carregadas", async () => {
    // O mock findMany só retorna MANUAL+PENDING (filtro do Prisma)
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "manual-pending-1",
        userId: "user-1",
        title: "Manual Pendente 1",
        description: null,
        category: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
      },
      {
        id: "manual-pending-2",
        userId: "user-1",
        title: "Manual Pendente 2",
        description: null,
        category: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
      },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await processRollover("user-1", yesterday, today);

    expect(result).toEqual({ carriedOver: 2 });
  });

  it("transação atômica: todas operações dentro de $transaction", async () => {
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        userId: "user-1",
        title: "Tarefa",
        description: null,
        category: null,
        sourceType: "MANUAL",
        status: "PENDING",
        scheduledDate: yesterday,
        originalDate: null,
      },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    await processRollover("user-1", yesterday, today);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    // Verifica que createMany, updateMany e user.update foram chamados
    expect(mockPrisma.dailyTask.createMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });
});

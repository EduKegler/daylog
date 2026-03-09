import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { completeTask, uncompleteTask, createTask } from "../mutations";

describe("completeTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("completes a pending task owned by user", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "PENDING",
    });
    mockPrisma.dailyTask.update.mockResolvedValue({});

    await completeTask("task-1", "user-1");

    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "COMPLETED", completedAt: expect.any(Date) },
    });
  });

  it("throws on non-existent task", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue(null);
    await expect(completeTask("bad-id", "user-1")).rejects.toThrow(
      "Task not found",
    );
  });

  it("throws on wrong user (ownership)", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "PENDING",
    });
    await expect(completeTask("task-1", "user-2")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });

  it("throws if already completed", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "COMPLETED",
    });
    await expect(completeTask("task-1", "user-1")).rejects.toThrow(
      "Already completed",
    );
  });
});

describe("uncompleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uncompletes a task completed today", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "COMPLETED",
      completedAt: new Date(),
    });
    mockPrisma.dailyTask.update.mockResolvedValue({});

    await uncompleteTask("task-1", "user-1");

    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "PENDING", completedAt: null },
    });
  });

  it("throws on wrong user (ownership)", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "COMPLETED",
      completedAt: new Date(),
    });
    await expect(uncompleteTask("task-1", "user-2")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });

  it("throws if task is not completed", async () => {
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "PENDING",
    });
    await expect(uncompleteTask("task-1", "user-1")).rejects.toThrow(
      "Task is not completed",
    );
  });

  it("throws if completed on a different day", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockPrisma.dailyTask.findUnique.mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      status: "COMPLETED",
      completedAt: yesterday,
    });
    await expect(uncompleteTask("task-1", "user-1")).rejects.toThrow(
      "Can only uncomplete tasks completed today",
    );
  });
});

describe("createTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a manual task for today", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mockPrisma.dailyTask.create.mockResolvedValue({ id: "new-1" });

    await createTask({
      userId: "user-1",
      title: "Buy coffee",
      scheduledDate: new Date(),
    });

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Buy coffee",
        description: null,
        category: null,
        scheduledDate: today,
      },
    });
  });

  it("creates a task for a specific future date", async () => {
    const futureDate = new Date("2026-03-15T12:00:00");
    const expected = new Date("2026-03-15T12:00:00");
    expected.setHours(0, 0, 0, 0);
    mockPrisma.dailyTask.create.mockResolvedValue({ id: "new-2" });

    await createTask({
      userId: "user-1",
      title: "Dentist",
      category: "Health",
      scheduledDate: futureDate,
    });

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Dentist",
        description: null,
        category: "Health",
        scheduledDate: expected,
      },
    });
  });
});

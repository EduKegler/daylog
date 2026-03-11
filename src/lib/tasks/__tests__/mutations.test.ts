import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import {
  completeTask,
  uncompleteTask,
  createTask,
  updateDailyTask,
  deleteTask,
} from "../mutations";

describe("completeTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("completes a pending task owned by user", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await completeTask("task-1", "user-1");

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1", status: { not: "COMPLETED" } },
      data: { status: "COMPLETED", completedAt: expect.any(Date) },
    });
  });

  it("throws on non-existent task", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("bad-id", "user-1")).rejects.toThrow(
      "Task not found or already completed",
    );
  });

  it("throws on wrong user (ownership)", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("task-1", "user-2")).rejects.toThrow(
      "Task not found or already completed",
    );
  });

  it("throws if already completed", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("task-1", "user-1")).rejects.toThrow(
      "Task not found or already completed",
    );
  });
});

describe("uncompleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uncompletes a task completed today", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await uncompleteTask("task-1", "user-1");

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-1",
        status: "COMPLETED",
        completedAt: { gte: expect.any(Date), lt: expect.any(Date) },
      },
      data: { status: "PENDING", completedAt: null },
    });
  });

  it("throws on wrong user (ownership)", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(uncompleteTask("task-1", "user-2")).rejects.toThrow(
      "Task not found or cannot be uncompleted",
    );
  });

  it("throws if task is not completed", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(uncompleteTask("task-1", "user-1")).rejects.toThrow(
      "Task not found or cannot be uncompleted",
    );
  });

  it("throws if completed on a different day", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(uncompleteTask("task-1", "user-1")).rejects.toThrow(
      "Task not found or cannot be uncompleted",
    );
  });
});

describe("createTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a manual task for today", async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
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
    const futureDate = new Date("2026-03-15T12:00:00Z");
    const expected = new Date("2026-03-15T00:00:00Z");
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

describe("updateDailyTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates task with basic data", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await updateDailyTask("task-1", "user-1", {
      title: "Updated title",
      description: "New desc",
      category: "Work",
    });

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
      data: {
        title: "Updated title",
        description: "New desc",
        category: "Work",
      },
    });
  });

  it("updates task with scheduledDate (calls startOfDay)", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await updateDailyTask("task-1", "user-1", {
      title: "Moved task",
      description: null,
      category: null,
      scheduledDate: new Date("2026-03-20T14:30:00Z"),
    });

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
      data: {
        title: "Moved task",
        description: null,
        category: null,
        scheduledDate: new Date("2026-03-20T00:00:00Z"),
      },
    });
  });

  it("throws when task not found (count === 0)", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      updateDailyTask("bad-id", "user-1", {
        title: "No task",
        description: null,
        category: null,
      }),
    ).rejects.toThrow("Task not found or unauthorized");
  });
});

describe("deleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes task owned by user", async () => {
    mockPrisma.dailyTask.deleteMany.mockResolvedValue({ count: 1 });

    await deleteTask("task-1", "user-1");

    expect(mockPrisma.dailyTask.deleteMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
    });
  });

  it("throws when task not found (count === 0)", async () => {
    mockPrisma.dailyTask.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteTask("bad-id", "user-1")).rejects.toThrow(
      "Task not found or unauthorized",
    );
  });
});

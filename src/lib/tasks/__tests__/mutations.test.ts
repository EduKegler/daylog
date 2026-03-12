import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OwnerFilter } from "@/lib/auth/owner-context";

const mockPrisma = vi.hoisted(() => ({
  dailyTask: {
    create: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma)),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import {
  completeTask,
  uncompleteTask,
  createTask,
  updateDailyTask,
  deleteTask,
  syncPendingRecurringInstances,
} from "../mutations";

const userFilter: OwnerFilter = { userId: "user-1" };

describe("completeTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("completes a pending task owned by user", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await completeTask("task-1", userFilter);

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1", status: { notIn: ["COMPLETED", "DISMISSED"] } },
      data: { status: "COMPLETED", completedAt: expect.any(Date) },
    });
  });

  it("completes a pending task owned by guest", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });
    const guestFilter: OwnerFilter = { guestSessionId: "guest-1" };

    await completeTask("task-1", guestFilter);

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { id: "task-1", guestSessionId: "guest-1", status: { notIn: ["COMPLETED", "DISMISSED"] } },
      data: { status: "COMPLETED", completedAt: expect.any(Date) },
    });
  });

  it("throws on non-existent task", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("bad-id", userFilter)).rejects.toThrow(
      "Task not found or already completed",
    );
  });

  it("throws on wrong user (ownership)", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("task-1", { userId: "user-2" })).rejects.toThrow(
      "Task not found or already completed",
    );
  });

  it("throws if already completed", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeTask("task-1", userFilter)).rejects.toThrow(
      "Task not found or already completed",
    );
  });
});

describe("uncompleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uncompletes a task completed today", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 1 });

    await uncompleteTask("task-1", userFilter);

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
    await expect(uncompleteTask("task-1", { userId: "user-2" })).rejects.toThrow(
      "Task not found or cannot be uncompleted",
    );
  });

  it("throws if task is not completed", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(uncompleteTask("task-1", userFilter)).rejects.toThrow(
      "Task not found or cannot be uncompleted",
    );
  });

  it("throws if completed on a different day", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });
    await expect(uncompleteTask("task-1", userFilter)).rejects.toThrow(
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
      tagIds: [],
      scheduledDate: new Date(),
    });

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Buy coffee",
        description: null,
        scheduledDate: today,
        tags: { connect: [] },
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
      tagIds: ["tag-1"],
      scheduledDate: futureDate,
    });

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sourceType: "MANUAL",
        title: "Dentist",
        description: null,
        scheduledDate: expected,
        tags: { connect: [{ id: "tag-1" }] },
      },
    });
  });

  it("creates a task for guest", async () => {
    mockPrisma.dailyTask.create.mockResolvedValue({ id: "new-3" });

    await createTask({
      guestSessionId: "guest-1",
      title: "Guest task",
      tagIds: [],
      scheduledDate: new Date("2026-03-11T00:00:00Z"),
    });

    expect(mockPrisma.dailyTask.create).toHaveBeenCalledWith({
      data: {
        guestSessionId: "guest-1",
        sourceType: "MANUAL",
        title: "Guest task",
        description: null,
        scheduledDate: new Date("2026-03-11T00:00:00Z"),
        tags: { connect: [] },
      },
    });
  });
});

describe("updateDailyTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction = vi.fn(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma));
  });

  it("updates task with basic data", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({ id: "task-1" });
    mockPrisma.dailyTask.update.mockResolvedValue({ id: "task-1" });

    await updateDailyTask("task-1", userFilter, {
      title: "Updated title",
      description: "New desc",
    });

    expect(mockPrisma.dailyTask.findFirst).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
    });
    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: {
        title: "Updated title",
        description: "New desc",
      },
    });
  });

  it("updates task with scheduledDate (calls startOfDay)", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({ id: "task-1" });
    mockPrisma.dailyTask.update.mockResolvedValue({ id: "task-1" });

    await updateDailyTask("task-1", userFilter, {
      title: "Moved task",
      description: null,
      scheduledDate: new Date("2026-03-20T14:30:00Z"),
    });

    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: {
        title: "Moved task",
        description: null,
        scheduledDate: new Date("2026-03-20T00:00:00Z"),
      },
    });
  });

  it("updates task with tagIds", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({ id: "task-1" });
    mockPrisma.dailyTask.update.mockResolvedValue({ id: "task-1" });

    await updateDailyTask("task-1", userFilter, {
      title: "Tagged task",
      tagIds: ["tag-1", "tag-2"],
    });

    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: {
        title: "Tagged task",
        tags: { set: [{ id: "tag-1" }, { id: "tag-2" }] },
      },
    });
  });

  it("does nothing when task not found", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue(null);

    await updateDailyTask("bad-id", userFilter, {
      title: "No task",
      description: null,
    });

    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("physically deletes a manual task", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({
      sourceType: "MANUAL",
      recurringTaskId: null,
    });
    mockPrisma.dailyTask.delete.mockResolvedValue({ id: "task-1" });

    await deleteTask("task-1", userFilter);

    expect(mockPrisma.dailyTask.findFirst).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
      select: { sourceType: true, recurringTaskId: true },
    });
    expect(mockPrisma.dailyTask.delete).toHaveBeenCalledWith({
      where: { id: "task-1" },
    });
    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });

  it("soft-deletes a recurring task instance (sets status to DISMISSED)", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({
      sourceType: "RECURRING",
      recurringTaskId: "rec-1",
    });
    mockPrisma.dailyTask.update.mockResolvedValue({ id: "task-1" });

    await deleteTask("task-1", userFilter);

    expect(mockPrisma.dailyTask.findFirst).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
      select: { sourceType: true, recurringTaskId: true },
    });
    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "DISMISSED" },
    });
    expect(mockPrisma.dailyTask.delete).not.toHaveBeenCalled();
  });

  it("physically deletes an orphaned recurring task (recurringTaskId is null)", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue({
      sourceType: "RECURRING",
      recurringTaskId: null,
    });
    mockPrisma.dailyTask.delete.mockResolvedValue({ id: "task-1" });

    await deleteTask("task-1", userFilter);

    expect(mockPrisma.dailyTask.delete).toHaveBeenCalledWith({
      where: { id: "task-1" },
    });
    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });

  it("throws when task not found", async () => {
    mockPrisma.dailyTask.findFirst.mockResolvedValue(null);

    await expect(deleteTask("bad-id", userFilter)).rejects.toThrow(
      "Task not found or unauthorized",
    );
  });
});

describe("syncPendingRecurringInstances", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates title and description on all pending instances", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "dt-1" },
      { id: "dt-2" },
    ]);
    mockPrisma.dailyTask.update.mockResolvedValue({});

    await syncPendingRecurringInstances("rec-1", {
      title: "New title",
      description: "New desc",
      tagIds: ["tag-1"],
    });

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalledWith({
      where: { recurringTaskId: "rec-1", status: "PENDING" },
      data: { title: "New title", description: "New desc" },
    });
  });

  it("updates tags on each pending instance individually", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.dailyTask.findMany.mockResolvedValue([
      { id: "dt-1" },
      { id: "dt-2" },
    ]);
    mockPrisma.dailyTask.update.mockResolvedValue({});

    await syncPendingRecurringInstances("rec-1", {
      title: "New title",
      description: null,
      tagIds: ["tag-1", "tag-2"],
    });

    expect(mockPrisma.dailyTask.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "dt-1" },
      data: { tags: { set: [{ id: "tag-1" }, { id: "tag-2" }] } },
    });
    expect(mockPrisma.dailyTask.update).toHaveBeenCalledWith({
      where: { id: "dt-2" },
      data: { tags: { set: [{ id: "tag-1" }, { id: "tag-2" }] } },
    });
  });

  it("skips findMany and tag updates when no pending instances exist", async () => {
    mockPrisma.dailyTask.updateMany.mockResolvedValue({ count: 0 });

    await syncPendingRecurringInstances("rec-1", {
      title: "New title",
      description: null,
      tagIds: ["tag-1"],
    });

    expect(mockPrisma.dailyTask.updateMany).toHaveBeenCalled();
    expect(mockPrisma.dailyTask.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.dailyTask.update).not.toHaveBeenCalled();
  });
});

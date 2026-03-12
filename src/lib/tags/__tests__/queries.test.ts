import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  tag: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import {
  getTagsByOwner,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from "../queries";
import type { OwnerFilter } from "@/lib/auth/owner-context";

describe("tag queries", () => {
  const userFilter: OwnerFilter = { userId: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTagsByOwner returns tags ordered by name", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([
      { id: "t1", name: "corpo", color: "rose" },
    ]);
    const result = await getTagsByOwner(userFilter);
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    });
    expect(result).toEqual([{ id: "t1", name: "corpo", color: "rose" }]);
  });

  it("createTag creates with owner filter", async () => {
    mockPrisma.tag.create.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    const result = await createTag(userFilter, "corpo", "rose");
    expect(mockPrisma.tag.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "corpo", color: "rose" },
      select: { id: true, name: true, color: true },
    });
    expect(result).toEqual({ id: "t1", name: "corpo", color: "rose" });
  });

  it("getTagById returns tag if owned", async () => {
    mockPrisma.tag.findFirst.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    const result = await getTagById("t1", userFilter);
    expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
      where: { id: "t1", userId: "user-1" },
      select: { id: true, name: true, color: true },
    });
    expect(result).toEqual({ id: "t1", name: "corpo", color: "rose" });
  });

  it("updateTag updates name and color", async () => {
    mockPrisma.tag.update.mockResolvedValue({ id: "t1", name: "saude", color: "emerald" });
    const result = await updateTag("t1", { name: "saude", color: "emerald" });
    expect(mockPrisma.tag.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { name: "saude", color: "emerald" },
      select: { id: true, name: true, color: true },
    });
    expect(result).toEqual({ id: "t1", name: "saude", color: "emerald" });
  });

  it("deleteTag deletes by id", async () => {
    mockPrisma.tag.delete.mockResolvedValue({ id: "t1" });
    await deleteTag("t1");
    expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});

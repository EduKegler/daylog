import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/owner-context", () => ({
  resolveOwnerContext: vi.fn(),
  resolveWriteContext: vi.fn(),
  buildOwnerFilter: vi.fn(),
}));

vi.mock("@/lib/tags/queries", () => ({
  getTagsByOwner: vi.fn(),
  getTagById: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

import {
  resolveOwnerContext,
  resolveWriteContext,
  buildOwnerFilter,
} from "@/lib/auth/owner-context";
import {
  getTagsByOwner,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/tags/queries";
import {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "../actions";
import type { OwnerContext, OwnerFilter } from "@/lib/auth/owner-context";

const mockResolveOwnerContext = vi.mocked(resolveOwnerContext);
const mockResolveWriteContext = vi.mocked(resolveWriteContext);
const mockBuildOwnerFilter = vi.mocked(buildOwnerFilter);
const mockGetTagsByOwner = vi.mocked(getTagsByOwner);
const mockGetTagById = vi.mocked(getTagById);
const mockCreateTag = vi.mocked(createTag);
const mockUpdateTag = vi.mocked(updateTag);
const mockDeleteTag = vi.mocked(deleteTag);

const userCtx: OwnerContext = { type: "user", userId: "user-1", timezone: "America/Sao_Paulo" };
const userFilter: OwnerFilter = { userId: "user-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTagAction", () => {
  it("creates a tag with valid input", async () => {
    mockResolveWriteContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagsByOwner.mockResolvedValue([]);
    mockCreateTag.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });

    const result = await createTagAction("corpo", "rose");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tag).toEqual({ id: "t1", name: "corpo", color: "rose" });
    }
    expect(mockCreateTag).toHaveBeenCalledWith(userFilter, "corpo", "rose");
  });

  it("returns error when tag name already exists", async () => {
    mockResolveWriteContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagsByOwner.mockResolvedValue([{ id: "t1", name: "corpo", color: "rose" }]);

    const result = await createTagAction("corpo", "blue");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBe("Tag already exists");
    }
    expect(mockCreateTag).not.toHaveBeenCalled();
  });

  it("returns error for invalid color", async () => {
    mockResolveWriteContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);

    const result = await createTagAction("corpo", "invalid-color");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.color).toBeDefined();
    }
    expect(mockCreateTag).not.toHaveBeenCalled();
  });

  it("returns error for empty tag name", async () => {
    mockResolveWriteContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);

    const result = await createTagAction("", "rose");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("trims and lowercases name before duplicate check", async () => {
    mockResolveWriteContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagsByOwner.mockResolvedValue([]);
    mockCreateTag.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });

    await createTagAction("  Corpo  ", "rose");

    expect(mockCreateTag).toHaveBeenCalledWith(userFilter, "corpo", "rose");
  });
});

describe("updateTagAction", () => {
  it("updates tag name and color", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    mockGetTagsByOwner.mockResolvedValue([{ id: "t1", name: "corpo", color: "rose" }]);
    mockUpdateTag.mockResolvedValue({ id: "t1", name: "saude", color: "emerald" });

    const result = await updateTagAction("t1", { name: "saude", color: "emerald" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tag).toEqual({ id: "t1", name: "saude", color: "emerald" });
    }
    expect(mockUpdateTag).toHaveBeenCalledWith("t1", { name: "saude", color: "emerald" });
  });

  it("returns error when tag is not owned by user", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue(null);

    const result = await updateTagAction("t-other", { name: "saude" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toBe("Tag not found");
    }
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("returns error when renaming to a duplicate name", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    mockGetTagsByOwner.mockResolvedValue([
      { id: "t1", name: "corpo", color: "rose" },
      { id: "t2", name: "saude", color: "emerald" },
    ]);

    const result = await updateTagAction("t1", { name: "saude" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBe("Tag already exists");
    }
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("returns error when no session", async () => {
    mockResolveOwnerContext.mockResolvedValue(null);

    const result = await updateTagAction("t1", { name: "saude" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toBe("Not authenticated");
    }
  });

  it("returns error for invalid color", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });

    const result = await updateTagAction("t1", { color: "not-a-color" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.color).toBeDefined();
    }
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("does not check duplicates when only color is updated", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    mockUpdateTag.mockResolvedValue({ id: "t1", name: "corpo", color: "emerald" });

    const result = await updateTagAction("t1", { color: "emerald" });

    expect(result.success).toBe(true);
    expect(mockGetTagsByOwner).not.toHaveBeenCalled();
    expect(mockUpdateTag).toHaveBeenCalledWith("t1", { color: "emerald" });
  });
});

describe("deleteTagAction", () => {
  it("deletes an owned tag", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue({ id: "t1", name: "corpo", color: "rose" });
    mockDeleteTag.mockResolvedValue();

    const result = await deleteTagAction("t1");

    expect(result.success).toBe(true);
    expect(mockDeleteTag).toHaveBeenCalledWith("t1");
  });

  it("returns error when tag is not owned by user", async () => {
    mockResolveOwnerContext.mockResolvedValue(userCtx);
    mockBuildOwnerFilter.mockReturnValue(userFilter);
    mockGetTagById.mockResolvedValue(null);

    const result = await deleteTagAction("t-other");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toBe("Tag not found");
    }
    expect(mockDeleteTag).not.toHaveBeenCalled();
  });

  it("returns error when no session", async () => {
    mockResolveOwnerContext.mockResolvedValue(null);

    const result = await deleteTagAction("t1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toBe("Not authenticated");
    }
    expect(mockDeleteTag).not.toHaveBeenCalled();
  });
});

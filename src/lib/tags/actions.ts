"use server";

import {
  resolveOwnerContext,
  resolveWriteContext,
  buildOwnerFilter,
} from "@/lib/auth/owner-context";
import { validateTagInput } from "./validation";
import {
  getTagById,
  getTagsByOwner,
  createTag,
  updateTag,
  deleteTag,
} from "./queries";
import type { TagRecord } from "./queries";

type TagActionResult =
  | { success: true; tag: TagRecord }
  | { success: false; errors: Record<string, string> };

type DeleteActionResult =
  | { success: true }
  | { success: false; errors: Record<string, string> };

export async function createTagAction(
  name: string,
  color: string,
): Promise<TagActionResult> {
  const ctx = await resolveWriteContext();
  const filter = buildOwnerFilter(ctx);

  const validation = validateTagInput({ name, color });
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const existing = await getTagsByOwner(filter);
  if (existing.some((t) => t.name === validation.data.name)) {
    return { success: false, errors: { name: "Tag already exists" } };
  }

  const tag = await createTag(filter, validation.data.name, validation.data.color);
  return { success: true, tag };
}

export async function updateTagAction(
  tagId: string,
  data: { name?: string; color?: string },
): Promise<TagActionResult> {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return { success: false, errors: { _form: "Not authenticated" } };
  }
  const filter = buildOwnerFilter(ctx);

  const tag = await getTagById(tagId, filter);
  if (!tag) {
    return { success: false, errors: { _form: "Tag not found" } };
  }

  const nameToValidate = data.name ?? tag.name;
  const colorToValidate = data.color ?? tag.color;
  const validation = validateTagInput({ name: nameToValidate, color: colorToValidate });
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  if (data.name !== undefined) {
    const existing = await getTagsByOwner(filter);
    if (existing.some((t) => t.name === validation.data.name && t.id !== tagId)) {
      return { success: false, errors: { name: "Tag already exists" } };
    }
  }

  const updateData: { name?: string; color?: string } = {};
  if (data.name !== undefined) updateData.name = validation.data.name;
  if (data.color !== undefined) updateData.color = validation.data.color;

  const updated = await updateTag(tagId, updateData);
  return { success: true, tag: updated };
}

export async function deleteTagAction(
  tagId: string,
): Promise<DeleteActionResult> {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return { success: false, errors: { _form: "Not authenticated" } };
  }
  const filter = buildOwnerFilter(ctx);

  const tag = await getTagById(tagId, filter);
  if (!tag) {
    return { success: false, errors: { _form: "Tag not found" } };
  }

  await deleteTag(tagId);
  return { success: true };
}

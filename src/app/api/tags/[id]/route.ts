import { NextResponse } from "next/server";
import {
  resolveOwnerContext,
  buildOwnerFilter,
} from "@/lib/auth/owner-context";
import {
  getTagById,
  getTagsByOwner,
  updateTag,
  deleteTag,
} from "@/lib/tags/queries";
import { validateTagInput } from "@/lib/tags/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const filter = buildOwnerFilter(ctx);

  const tag = await getTagById(id, filter);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const body = await request.json();
  const nameToValidate = body.name ?? tag.name;
  const colorToValidate = body.color ?? tag.color;
  const validation = validateTagInput({ name: nameToValidate, color: colorToValidate });
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  if (body.name !== undefined) {
    const existing = await getTagsByOwner(filter);
    if (existing.some((t) => t.name === validation.data.name && t.id !== id)) {
      return NextResponse.json(
        { errors: { name: "Tag already exists" } },
        { status: 409 }
      );
    }
  }

  const updateData: { name?: string; color?: string } = {};
  if (body.name !== undefined) updateData.name = validation.data.name;
  if (body.color !== undefined) updateData.color = validation.data.color;

  const updated = await updateTag(id, updateData);
  return NextResponse.json({ tag: updated });
}

export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const filter = buildOwnerFilter(ctx);

  const tag = await getTagById(id, filter);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await deleteTag(id);
  return new NextResponse(null, { status: 204 });
}

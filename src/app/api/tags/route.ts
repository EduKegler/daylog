import { NextResponse } from "next/server";
import {
  resolveOwnerContext,
  resolveWriteContext,
  buildOwnerFilter,
} from "@/lib/auth/owner-context";
import { getTagsByOwner, createTag } from "@/lib/tags/queries";
import { validateTagInput } from "@/lib/tags/validation";

export async function GET(): Promise<NextResponse> {
  const ctx = await resolveOwnerContext();
  if (!ctx) {
    return NextResponse.json({ tags: [] });
  }
  const filter = buildOwnerFilter(ctx);
  const tags = await getTagsByOwner(filter);
  return NextResponse.json({ tags });
}

export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await resolveWriteContext();
  const filter = buildOwnerFilter(ctx);

  const body = await request.json();
  const validation = validateTagInput(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const existing = await getTagsByOwner(filter);
  if (existing.some((t) => t.name === validation.data.name)) {
    return NextResponse.json(
      { errors: { name: "Tag already exists" } },
      { status: 409 }
    );
  }

  const tag = await createTag(filter, validation.data.name, validation.data.color);
  return NextResponse.json({ tag }, { status: 201 });
}

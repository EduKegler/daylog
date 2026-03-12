# Tags System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `category` field with a multi-tag system where each tag has a name + pastel color, is owned per user/guest, and supports many-to-many relations with both DailyTask and RecurringTask.

**Architecture:** New `Tag` model with owner polymorphism (userId | guestSessionId). Prisma implicit join tables for many-to-many. Tags CRUD via API routes + server actions. `TagsInput` component with autocomplete dropdown + inline color picker for creation. Migration converts existing `category` values into tags.

**Tech Stack:** Prisma 7, Next.js 16 App Router, React Query v5, Zod, Radix UI (for dropdown), Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-03-12-tags-system-design.md`

---

## Chunk 1: Foundation — Colors, Validation, Schema, Tag CRUD

### Task 1: Tag color map

**Files:**
- Create: `src/lib/tags/colors.ts`

- [ ] **Step 1: Create the color map constant**

```ts
export type TagColorKey =
  | "rose"
  | "orange"
  | "amber"
  | "lime"
  | "emerald"
  | "sky"
  | "blue"
  | "violet"
  | "pink"
  | "stone";

type TagColor = {
  bg: string;
  text: string;
};

export const TAG_COLORS: Record<TagColorKey, TagColor> = {
  rose: { bg: "#FECDD3", text: "#9F1239" },
  orange: { bg: "#FED7AA", text: "#9A3412" },
  amber: { bg: "#FDE68A", text: "#854D0E" },
  lime: { bg: "#D9F99D", text: "#3F6212" },
  emerald: { bg: "#A7F3D0", text: "#065F46" },
  sky: { bg: "#BAE6FD", text: "#075985" },
  blue: { bg: "#BFDBFE", text: "#1E40AF" },
  violet: { bg: "#E9D5FF", text: "#6B21A8" },
  pink: { bg: "#FBCFE8", text: "#9D174D" },
  stone: { bg: "#E7E5E4", text: "#44403C" },
};

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS) as TagColorKey[];

export function isValidTagColor(color: string): color is TagColorKey {
  return color in TAG_COLORS;
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: success

- [ ] **Step 3: Commit**

```bash
git add src/lib/tags/colors.ts
git commit -m "feat(tags): add tag color map constant"
```

---

### Task 2: Tag validation

**Files:**
- Create: `src/lib/tags/validation.ts`
- Create: `src/lib/tags/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/tags/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateTagInput } from "../validation";

describe("validateTagInput", () => {
  it("accepts valid input", () => {
    const result = validateTagInput({ name: "corpo", color: "rose" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("corpo");
      expect(result.data.color).toBe("rose");
    }
  });

  it("trims and lowercases name", () => {
    const result = validateTagInput({ name: "  Corpo  ", color: "rose" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("corpo");
    }
  });

  it("rejects empty name", () => {
    const result = validateTagInput({ name: "", color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("rejects name over 30 chars", () => {
    const result = validateTagInput({ name: "a".repeat(31), color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("rejects invalid color key", () => {
    const result = validateTagInput({ name: "corpo", color: "red" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.color).toBeDefined();
    }
  });

  it("rejects whitespace-only name", () => {
    const result = validateTagInput({ name: "   ", color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/lib/tags/__tests__/validation.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement validation**

```ts
// src/lib/tags/validation.ts
import { isValidTagColor } from "./colors";
import type { TagColorKey } from "./colors";

export const TAG_NAME_MAX_LENGTH = 30;

type TagInputErrors = {
  name?: string;
  color?: string;
};

type TagValidationSuccess = {
  success: true;
  data: { name: string; color: TagColorKey };
};

type TagValidationFailure = {
  success: false;
  errors: TagInputErrors;
};

export type TagValidationResult = TagValidationSuccess | TagValidationFailure;

export function validateTagInput(input: {
  name: string;
  color: string;
}): TagValidationResult {
  const errors: TagInputErrors = {};

  const trimmedName = input.name.trim().toLowerCase();

  if (trimmedName.length === 0) {
    errors.name = "Tag name is required";
  } else if (trimmedName.length > TAG_NAME_MAX_LENGTH) {
    errors.name = `Tag name must be at most ${TAG_NAME_MAX_LENGTH} characters`;
  }

  if (!isValidTagColor(input.color)) {
    errors.color = "Invalid tag color";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { name: trimmedName, color: input.color as TagColorKey },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/tags/__tests__/validation.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tags/validation.ts src/lib/tags/__tests__/validation.test.ts
git commit -m "feat(tags): add tag input validation with tests"
```

---

### Task 3: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration SQL file

- [ ] **Step 1: Update Prisma schema (Phase 1 — additive only)**

Add `Tag` model and `tags Tag[]` relations. **Keep `category String?` for now** — it will be removed in a final cleanup task after all code is migrated. This avoids a prolonged broken build.

In `prisma/schema.prisma`:

1. Add to `User` model: `tags Tag[]`
2. Add to `GuestSession` model: `tags Tag[]`
3. Add `Tag` model (see spec)
4. Add `tags Tag[]` to `DailyTask` and `RecurringTask`
5. Do NOT remove `category` yet — that happens in Task 25

- [ ] **Step 2: Create migration SQL**

Run: `pnpm prisma migrate dev --create-only --name add_tags`

This generates the migration folder. Then edit the generated SQL to add:
- The `CHECK (num_nonnulls("userId", "guestSessionId") = 1)` constraint on `Tag`
- The partial unique indexes (replacing any standard unique constraints Prisma generated)
- The data migration (INSERT INTO Tag from category, INSERT INTO join tables)

The data migration SQL (append after Prisma's generated DDL):

```sql
-- Data migration: convert existing category values to tags
-- Step 1: Create tags from DailyTask + RecurringTask categories (deduplicated by owner + lowercased name)
INSERT INTO "Tag" ("id", "userId", "guestSessionId", "name", "color", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "userId",
  "guestSessionId",
  lower_name,
  (ARRAY['rose','orange','amber','lime','emerald','sky','blue','violet','pink','stone'])[
    (ROW_NUMBER() OVER (PARTITION BY COALESCE("userId", "guestSessionId") ORDER BY lower_name))::int
    % 10 + 1
  ],
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT ON ("userId", "guestSessionId", lower(trim("category")))
    "userId",
    "guestSessionId",
    lower(trim("category")) AS lower_name
  FROM (
    SELECT "userId", "guestSessionId", "category" FROM "DailyTask"
    WHERE "category" IS NOT NULL AND trim("category") != ''
    UNION ALL
    SELECT "userId", "guestSessionId", "category" FROM "RecurringTask"
    WHERE "category" IS NOT NULL AND trim("category") != ''
  ) AS all_cats
  ORDER BY "userId", "guestSessionId", lower(trim("category"))
) AS cats;

-- Step 2: Link DailyTasks to their tags
INSERT INTO "_DailyTaskToTag" ("A", "B")
SELECT dt."id", t."id"
FROM "DailyTask" dt
JOIN "Tag" t ON (
  (dt."userId" IS NOT NULL AND dt."userId" = t."userId" AND lower(trim(dt."category")) = t."name")
  OR
  (dt."guestSessionId" IS NOT NULL AND dt."guestSessionId" = t."guestSessionId" AND lower(trim(dt."category")) = t."name")
)
WHERE dt."category" IS NOT NULL AND trim(dt."category") != '';

-- Step 3: Link RecurringTasks to their tags
INSERT INTO "_RecurringTaskToTag" ("A", "B")
SELECT rt."id", t."id"
FROM "RecurringTask" rt
JOIN "Tag" t ON (
  (rt."userId" IS NOT NULL AND rt."userId" = t."userId" AND lower(trim(rt."category")) = t."name")
  OR
  (rt."guestSessionId" IS NOT NULL AND rt."guestSessionId" = t."guestSessionId" AND lower(trim(rt."category")) = t."name")
)
WHERE rt."category" IS NOT NULL AND trim(rt."category") != '';

-- Partial unique indexes for case-insensitive name uniqueness per owner
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag" ("userId", lower("name")) WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "Tag_guestSessionId_name_key" ON "Tag" ("guestSessionId", lower("name")) WHERE "guestSessionId" IS NOT NULL;

-- Owner constraint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_owner_check" CHECK (num_nonnulls("userId", "guestSessionId") = 1);
```

Note: The implicit join table column names (`A`, `B`) follow Prisma's convention where `A` is the model that comes first alphabetically. Verify by checking the generated migration DDL — `_DailyTaskToTag` has `A` = DailyTask.id, `B` = Tag.id. `_RecurringTaskToTag` has `A` = RecurringTask.id, `B` = Tag.id.

- [ ] **Step 3: Run migration**

Run: `pnpm prisma migrate dev`
Expected: migration applies successfully

- [ ] **Step 4: Generate Prisma client**

Run: `pnpm prisma generate`
Expected: client regenerated with Tag model

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: build succeeds (category is still in the schema, new Tag model is additive)

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/generated/
git commit -m "feat(tags): add Tag model with migration from category"
```

---

### Task 4: Tag Prisma queries

**Files:**
- Create: `src/lib/tags/queries.ts`
- Create: `src/lib/tags/__tests__/queries.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/tags/__tests__/queries.test.ts
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
    mockPrisma.tag.create.mockResolvedValue({
      id: "t1",
      name: "corpo",
      color: "rose",
    });

    const result = await createTag(userFilter, "corpo", "rose");

    expect(mockPrisma.tag.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "corpo", color: "rose" },
      select: { id: true, name: true, color: true },
    });
    expect(result).toEqual({ id: "t1", name: "corpo", color: "rose" });
  });

  it("getTagById returns tag if owned", async () => {
    mockPrisma.tag.findFirst.mockResolvedValue({
      id: "t1",
      name: "corpo",
      color: "rose",
    });

    const result = await getTagById("t1", userFilter);

    expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
      where: { id: "t1", userId: "user-1" },
      select: { id: true, name: true, color: true },
    });
    expect(result).toEqual({ id: "t1", name: "corpo", color: "rose" });
  });

  it("updateTag updates name and color", async () => {
    mockPrisma.tag.update.mockResolvedValue({
      id: "t1",
      name: "saude",
      color: "emerald",
    });

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

    expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
      where: { id: "t1" },
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/lib/tags/__tests__/queries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tag queries**

```ts
// src/lib/tags/queries.ts
import { prisma } from "@/lib/db/prisma";
import type { OwnerFilter } from "@/lib/auth/owner-context";

const tagSelect = { id: true, name: true, color: true } as const;

export type TagRecord = {
  id: string;
  name: string;
  color: string;
};

export async function getTagsByOwner(
  filter: OwnerFilter
): Promise<TagRecord[]> {
  return prisma.tag.findMany({
    where: filter,
    select: tagSelect,
    orderBy: { name: "asc" },
  });
}

export async function getTagById(
  id: string,
  filter: OwnerFilter
): Promise<TagRecord | null> {
  return prisma.tag.findFirst({
    where: { id, ...filter },
    select: tagSelect,
  });
}

export async function createTag(
  filter: OwnerFilter,
  name: string,
  color: string
): Promise<TagRecord> {
  return prisma.tag.create({
    data: { ...filter, name, color },
    select: tagSelect,
  });
}

export async function updateTag(
  id: string,
  data: { name?: string; color?: string }
): Promise<TagRecord> {
  return prisma.tag.update({
    where: { id },
    data,
    select: tagSelect,
  });
}

export async function deleteTag(id: string): Promise<void> {
  await prisma.tag.delete({ where: { id } });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/tags/__tests__/queries.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tags/queries.ts src/lib/tags/__tests__/queries.test.ts
git commit -m "feat(tags): add tag Prisma queries with tests"
```

---

### Task 5: Tag server actions

**Files:**
- Create: `src/lib/tags/actions.ts`
- Create: `src/lib/tags/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing tests for tag actions**

Create `src/lib/tags/__tests__/actions.test.ts` with tests for:
- `createTagAction`: valid input creates tag, duplicate name returns error, invalid color returns error
- `updateTagAction`: updates name/color, rejects non-owned tag, rejects duplicate name
- `deleteTagAction`: deletes owned tag, rejects non-owned tag

Mock `@/lib/auth/owner-context` (resolveOwnerContext, resolveWriteContext, buildOwnerFilter) and `@/lib/tags/queries` (getTagsByOwner, getTagById, createTag, updateTag, deleteTag).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/lib/tags/__tests__/actions.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tag server actions**

```ts
// src/lib/tags/actions.ts
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
  color: string
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
  data: { name?: string; color?: string }
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
  tagId: string
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/tags/__tests__/actions.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Verify build compiles**

Run: `pnpm build`
Expected: success

- [ ] **Step 6: Commit**

```bash
git add src/lib/tags/actions.ts src/lib/tags/__tests__/actions.test.ts
git commit -m "feat(tags): add tag server actions with tests (create, update, delete)"
```

---

### Task 6: Tag API routes

**Files:**
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/tags/[id]/route.ts`

- [ ] **Step 1: Create GET + POST route**

```ts
// src/app/api/tags/route.ts
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
```

- [ ] **Step 2: Create PATCH + DELETE route**

```ts
// src/app/api/tags/[id]/route.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tags/
git commit -m "feat(tags): add API routes (GET, POST, PATCH, DELETE)"
```

---

## Chunk 2: Task Layer — Remove category, Add tagIds

### Task 7: Update task validation

**Files:**
- Modify: `src/lib/tasks/validation.ts`
- Modify: `src/lib/tasks/__tests__/validation.test.ts`

- [ ] **Step 1: Update validation module**

In `src/lib/tasks/validation.ts`:

1. Remove `category` from `FIELD_LIMITS`
2. Remove `category` from `commonFieldsSchema`
3. Remove `category` from the return type of `validateCommonFields`
4. Add `MAX_TAGS_PER_TASK = 5` constant
5. Add `tagIds: string[]` to `TaskInput` and `RecurringTaskInput` types
6. In `validateTaskInput` and `validateRecurringTaskInput`, validate `tagIds.length <= MAX_TAGS_PER_TASK`

Key changes to `validateCommonFields`:
- Remove the `category` field from the Zod schema
- Remove `category` from the returned validated data
- Remove `category` from the errors object

Add to both `validateTaskInput` and `validateRecurringTaskInput`:
```ts
if (tagIds.length > MAX_TAGS_PER_TASK) {
  errors.tags = `Maximum ${MAX_TAGS_PER_TASK} tags per task`;
}
```

- [ ] **Step 2: Update existing validation tests**

In `src/lib/tasks/__tests__/validation.test.ts`:
- Remove all tests related to `category` field
- Add tests for `tagIds` max limit validation
- Update test data objects to remove `category` and add `tagIds: []`

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/lib/tasks/__tests__/validation.test.ts`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/tasks/validation.ts src/lib/tasks/__tests__/validation.test.ts
git commit -m "refactor(tasks): replace category with tagIds in validation"
```

---

### Task 8: Update task serialization

**Files:**
- Modify: `src/lib/tasks/serialize.ts`

- [ ] **Step 1: Update serializeTask**

In `src/lib/tasks/serialize.ts`:
- Remove `category: t.category` from output
- Add `tags: t.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })) ?? []`
- Update the input type to accept `tags?: Array<{ id: string; name: string; color: string }>`

- [ ] **Step 2: Commit**

```bash
git add src/lib/tasks/serialize.ts
git commit -m "refactor(tasks): replace category with tags in serialization"
```

---

### Task 9: Update task mutations

**Files:**
- Modify: `src/lib/tasks/mutations.ts`
- Modify: `src/lib/tasks/__tests__/mutations.test.ts`

- [ ] **Step 1: Update createTask**

In `src/lib/tasks/mutations.ts`:
- Remove `category` from `createTask` input and Prisma data
- Add `tagIds: string[]` to input
- Add `tags: { connect: tagIds.map(id => ({ id })) }` to Prisma create data

- [ ] **Step 2: Update updateDailyTask**

Change from `prisma.dailyTask.updateMany` to `prisma.dailyTask.update` inside an interactive transaction for atomic ownership verification:

```ts
return prisma.$transaction(async (tx) => {
  const task = await tx.dailyTask.findFirst({ where: { id: taskId, ...filter } });
  if (!task) throw new Error("Task not found");
  return tx.dailyTask.update({
    where: { id: taskId },
    data: { ...updateData, tags: { set: tagIds.map(id => ({ id })) } },
  });
});
```

This avoids the TOCTOU race condition by running findFirst + update in the same transaction.
- Remove `category` from update data
- Add `tags: { set: tagIds.map(id => ({ id })) }` to replace all tag associations

- [ ] **Step 3: Update tests**

In `src/lib/tasks/__tests__/mutations.test.ts`:
- Remove `category` from test data
- Add `tagIds: []` to test data
- Update mock expectations to include `tags: { connect: [] }` / `tags: { set: [] }`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/lib/tasks/__tests__/mutations.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tasks/mutations.ts src/lib/tasks/__tests__/mutations.test.ts
git commit -m "refactor(tasks): replace category with tags in mutations"
```

---

### Task 10: Update task Prisma queries

**Files:**
- Modify: `src/lib/tasks/queries.ts`

- [ ] **Step 1: Add tags include to all task queries**

In every Prisma query that fetches tasks, add `include: { tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } } }`:
- `getDailyTasksForDate` — add to the existing `include` (which already has `recurringTask`)
- `getRecurringTasks` — add `include: { tags: ... }`
- `getActiveRecurringTasks` — add `include: { tags: { select: { id: true } } }` (only IDs needed for rollover/instances)

- [ ] **Step 2: Commit**

```bash
git add src/lib/tasks/queries.ts
git commit -m "refactor(tasks): include tags in all task queries"
```

---

### Task 11: Update server actions

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/lib/tasks/actions.ts`

- [ ] **Step 1: Update daily task actions**

In `src/app/actions.ts`:
- `createTaskAction`: extract `tagIds` from FormData via `JSON.parse(formData.get("tagIds") as string || "[]")`, pass to `createTask`
- `updateTaskAction`: extract `tagIds` from data object, pass to `updateDailyTask`
- Remove all `category` references

- [ ] **Step 2: Update recurring task actions**

In `src/lib/tasks/actions.ts`:
- `createRecurringTask`: extract `tagIds` from FormData, add `tags: { connect: tagIds.map(id => ({ id })) }` to Prisma create
- `updateRecurringTask`: extract `tagIds` from FormData, add `tags: { set: tagIds.map(id => ({ id })) }` to Prisma update
- Remove all `category` references

- [ ] **Step 3: Commit**

```bash
git add src/app/actions.ts src/lib/tasks/actions.ts
git commit -m "refactor(tasks): replace category with tagIds in server actions"
```

---

### Task 12: Update API routes

**Files:**
- Modify: `src/app/api/tasks/daily/route.ts`
- Modify: `src/app/api/tasks/recurring/route.ts`

- [ ] **Step 1: Update daily route**

In `src/app/api/tasks/daily/route.ts`: the queries already include tags (from Task 10), and serialization already handles them (from Task 8). Verify no `category` references remain.

- [ ] **Step 2: Update recurring route**

In `src/app/api/tasks/recurring/route.ts`: remove `category: t.category` from response mapping, replace with `tags: t.tags` (already included from query).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tasks/daily/route.ts src/app/api/tasks/recurring/route.ts
git commit -m "refactor(api): update task routes for tags"
```

---

## Chunk 3: Rollover, Recurring Instances, Guest Claim

### Task 13: Update ensureRecurringInstances

**Files:**
- Modify: `src/lib/tasks/ensure-recurring-instances.ts`
- Modify: `src/lib/tasks/__tests__/ensure-recurring-instances.test.ts`

- [ ] **Step 1: Refactor to individual creates in transaction**

Replace the `createMany` call with individual `prisma.dailyTask.create()` calls inside `prisma.$transaction(async (tx) => { ... })`. Each create includes `tags: { connect: recurringTask.tags.map(t => ({ id: t.id })) }`.

The `getActiveRecurringTasks` query already includes `tags: { select: { id: true } }` (from Task 10).

- [ ] **Step 2: Update tests**

Remove `category` from test data, add `tags: []` to mock recurring tasks. Update mock expectations.

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/lib/tasks/__tests__/ensure-recurring-instances.test.ts`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/tasks/ensure-recurring-instances.ts src/lib/tasks/__tests__/ensure-recurring-instances.test.ts
git commit -m "refactor(rollover): connect tags in ensureRecurringInstances"
```

---

### Task 14: Update processRollover

**Files:**
- Modify: `src/lib/tasks/rollover.ts`
- Modify: `src/lib/tasks/__tests__/rollover.test.ts`

- [ ] **Step 1: Refactor to interactive transaction**

Change from `prisma.$transaction([...])` (batch) to `prisma.$transaction(async (tx) => { ... })` (interactive). Replace `createMany` with individual `tx.dailyTask.create()` calls that include `tags: { connect: ... }`.

The `pendingManual` query (the `prisma.dailyTask.findMany` that fetches yesterday's pending tasks) must add `include: { tags: { select: { id: true } } }` so tag IDs are available for the `connect` in each created carry-over task.

- [ ] **Step 2: Update tests**

Remove `category` from test data, add `tags: []`. Update mock expectations for individual creates.

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/lib/tasks/__tests__/rollover.test.ts`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/tasks/rollover.ts src/lib/tasks/__tests__/rollover.test.ts
git commit -m "refactor(rollover): connect tags in processRollover"
```

---

### Task 15: Update guest data claim

**Files:**
- Modify: `src/lib/guest/claim.ts`
- Modify: `src/lib/guest/__tests__/claim.test.ts`

- [ ] **Step 1: Add tag transfer/merge to claimGuestData**

Inside the existing transaction in `claimGuestData`:

1. After moving DailyTasks and RecurringTasks (which now reference tags by join table), handle tags:
2. Fetch guest tags: `tx.tag.findMany({ where: { guestSessionId } })`
3. Fetch user tags: `tx.tag.findMany({ where: { userId } })`
4. Build a map of user tags by lowercase name
5. For each guest tag:
   - If collision (user has same name): update join tables via `tx.$executeRaw` to point from guestTag.id → userTag.id, then delete guest tag
   - If no collision: `tx.tag.update({ where: { id: guestTag.id }, data: { guestSessionId: null, userId } })`
6. Return updated counts

- [ ] **Step 2: Update tests**

Add test cases for tag transfer (no collision) and tag merge (name collision). Mock the tag queries and `$executeRaw`.

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/lib/guest/__tests__/claim.test.ts`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/guest/claim.ts src/lib/guest/__tests__/claim.test.ts
git commit -m "feat(guest): transfer and merge tags in claimGuestData"
```

---

## Chunk 4: Client Layer — React Query + UI Components

### Task 16: React Query — tags hooks

**Files:**
- Modify: `src/lib/queries/keys.ts`
- Create: `src/lib/queries/tags.ts`

- [ ] **Step 1: Add tags key to factory**

In `src/lib/queries/keys.ts`, add:
```ts
tags: () => ["tags"] as const,
```

- [ ] **Step 2: Create tags hooks**

```ts
// src/lib/queries/tags.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { createTagAction, updateTagAction, deleteTagAction } from "@/lib/tags/actions";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export function useTags(): { data: Tag[] | undefined; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tags(),
    queryFn: async () => {
      const res = await fetch("/api/tags");
      const json = await res.json();
      return json.tags as Tag[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return { data, isLoading };
}

export function useCreateTag(): {
  mutateAsync: (params: { name: string; color: string }) => Promise<Tag>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: { name: string; color: string }) => {
      const result = await createTagAction(params.name, params.color);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
      return result.tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useUpdateTag(): {
  mutateAsync: (params: {
    tagId: string;
    data: { name?: string; color?: string };
  }) => Promise<Tag>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: {
      tagId: string;
      data: { name?: string; color?: string };
    }) => {
      const result = await updateTagAction(params.tagId, params.data);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
      return result.tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}

export function useDeleteTag(): {
  mutate: (tagId: string) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (tagId: string) => {
      const result = await deleteTagAction(tagId);
      if (!result.success) {
        throw new Error(Object.values(result.errors).join(", "));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
      // Also invalidate tasks since tag associations may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
    },
  });

  return { mutate: mutation.mutate, isPending: mutation.isPending };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/keys.ts src/lib/queries/tags.ts
git commit -m "feat(tags): add React Query hooks for tags CRUD"
```

---

### Task 17: Update task React Query hooks

**Files:**
- Modify: `src/lib/queries/daily.ts`
- Modify: `src/lib/queries/recurring.ts`

- [ ] **Step 1: Update Task type in daily.ts**

Replace `category: string | null` with `tags: Array<{ id: string; name: string; color: string }>` in the `Task` type.

- [ ] **Step 2: Update optimistic updates in daily.ts**

- `useCreateTask`: optimistic task gets `tags` from tag cache lookup: `const tagIds = JSON.parse(formData.get("tagIds") as string || "[]"); const allTags = queryClient.getQueryData(queryKeys.tags()); const tags = allTags?.filter(t => tagIds.includes(t.id)) ?? [];`
- `useUpdateTask`: the `data` param includes `tagIds`, optimistic update resolves tags from cache similarly
- Remove all `category` references from optimistic data

- [ ] **Step 3: Update RecurringTask type in recurring.ts**

Replace `category: string | null` with `tags: Array<{ id: string; name: string; color: string }>`.

- [ ] **Step 4: Update optimistic creates in recurring.ts**

- `useCreateRecurringTask`: resolve tags from cache using `tagIds` from FormData
- Remove all `category` references

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/daily.ts src/lib/queries/recurring.ts
git commit -m "refactor(queries): replace category with tags in task types and optimistic updates"
```

---

### Task 18: TagBadge component

**Files:**
- Create: `src/app/components/tag-badge.tsx`

- [ ] **Step 1: Create TagBadge**

```tsx
// src/app/components/tag-badge.tsx
import { TAG_COLORS } from "@/lib/tags/colors";
import type { TagColorKey } from "@/lib/tags/colors";

type TagBadgeProps = {
  name: string;
  color: string;
  onRemove?: () => void;
};

export function TagBadge({ name, color, onRemove }: TagBadgeProps): React.ReactElement {
  const palette = TAG_COLORS[color as TagColorKey] ?? TAG_COLORS.stone;

  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1"
      style={{ background: palette.bg, color: palette.text }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center bg-transparent border-none p-0 cursor-pointer"
          style={{ color: palette.text }}
          aria-label={`Remove tag ${name}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-60 hover:opacity-100 transition-opacity duration-200"
          >
            <path d="M4 4l6 6M10 4l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: success (category still in schema, code still compiles)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/tag-badge.tsx
git commit -m "feat(ui): add TagBadge component with pastel colors"
```

---

### Task 19: TagsInput component

**Files:**
- Create: `src/app/components/tags-input.tsx`

- [ ] **Step 1: Create TagsInput**

This is the most complex UI component. Key features:
- Renders selected tags as `TagBadge` chips with × remove buttons
- Inline text input after chips
- Dropdown opens on focus/typing, filters existing tags, shows "Create tag" option
- Color picker inline for new tag creation
- Keyboard: arrows, enter, backspace

The component uses `useTags()` and `useCreateTag()` internally. It receives `selectedTagIds` and `onChange` props.

Create the component with:
- `useState` for input text, dropdown open state, highlighted index, create mode, selected color
- `useRef` for input element (focus management)
- `useMemo` for filtered available tags
- Dropdown renders as positioned div below the input container
- Color picker: row of 10 circles, click to select

Follow the underline input pattern from DESIGN.md: `border-0 border-b border-border`, focus state `border-b-accent`.

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/tags-input.tsx
git commit -m "feat(ui): add TagsInput component with autocomplete and color picker"
```

---

### Task 20: Update TaskForm

**Files:**
- Modify: `src/app/components/task-form/task-form.tsx`
- Modify: `src/app/components/task-form/use-task-form-submit.ts`
- Modify: `src/app/components/task-form/types.ts`

- [ ] **Step 1: Update types.ts**

In `src/app/components/task-form/types.ts`:
- Replace `category: string | null` with `tags: Array<{ id: string; name: string; color: string }>` in both `OneTimeEditData` and `RecurringEditData`

- [ ] **Step 2: Update task-form.tsx**

1. Remove `category` state and input
2. Add `selectedTagIds` state: `useState<string[]>(initialData?.tags?.map(t => t.id) ?? [])`
3. Replace the category `<input>` with `<TagsInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />`
4. Pass `tagIds: selectedTagIds` to submit params
5. Remove `FIELD_LIMITS.category` references
6. Import `TagsInput` from `@/app/components/tags-input`

- [ ] **Step 2: Update use-task-form-submit.ts**

1. Add `tagIds: string[]` to submit params type
2. For create one-time: `formData.set("tagIds", JSON.stringify(params.tagIds))`
3. For create recurring: `formData.set("tagIds", JSON.stringify(params.tagIds))`
4. For edit one-time: include `tagIds: params.tagIds` in the data object
5. For edit recurring: `formData.set("tagIds", JSON.stringify(params.tagIds))`
6. Remove all `category` references

- [ ] **Step 3: Commit**

```bash
git add src/app/components/task-form/
git commit -m "refactor(ui): replace category input with TagsInput in TaskForm"
```

---

### Task 21: Update display components

**Files:**
- Modify: `src/app/components/task-item.tsx`
- Modify: `src/app/history/_components/history-day-card.tsx`
- Modify: `src/app/recurring/_components/recurring-task-list.tsx`
- Modify: `src/lib/queries/history.ts` (if it has a Task type with category)

- [ ] **Step 1: Update TaskItem**

1. Update `Task` type: replace `category: string | null` with `tags: Array<{ id: string; name: string; color: string }>`
2. Replace `{task.category && <span className={badge}>{task.category}</span>}` with:
```tsx
{task.tags.map(tag => (
  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
))}
```
3. Import `TagBadge` from `@/app/components/tag-badge`
4. Update the edit mode to pass `tags` to `TaskForm` initial data

- [ ] **Step 2: Update HistoryDayCard**

1. Replace `{task.category && <span className={badge}>{task.category}</span>}` with `TagBadge` mapping
2. Import `TagBadge`
3. Check `src/lib/queries/history.ts` for the `HistoryTask` type — update to include `tags` instead of `category`

- [ ] **Step 3: Update RecurringTaskList**

1. Replace category badge with `TagBadge` mapping
2. Import `TagBadge`
3. Update edit mode to pass `tags` to `TaskForm`

- [ ] **Step 4: Verify full build + tests**

Run: `pnpm build && pnpm test:run`
Expected: ALL pass — no more `category` references anywhere

- [ ] **Step 5: Commit**

```bash
git add src/app/components/task-item.tsx src/app/history/ src/app/recurring/ src/lib/queries/history.ts
git commit -m "refactor(ui): replace category badges with TagBadge in all display components"
```

---

### Task 22: Update history, upcoming, and cron queries

**Files:**
- Modify: `src/lib/history/queries.ts` — add `include: { tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } } }` to the `prisma.dailyTask.findMany` call. Update the `HistoryTask` type to include `tags` and remove `category`.
- Modify: `src/lib/upcoming/queries.ts` — same `include: { tags }` pattern. Update the response type.
- Modify: `src/lib/queries/history.ts` — update the client-side `HistoryTask`/`HistoryDay` type to include `tags` instead of `category`.
- Modify: `src/app/api/tasks/recurring/route.ts` — explicitly include `tags: t.tags` in the manual field mapping (the current mapping omits fields not listed).
- Verify: `src/app/api/cron/rollover/route.ts` — ensure no `category` references remain. The cron endpoint calls `processRollover` which is already updated in Task 14.

- [ ] **Step 1: Update history queries**

In `src/lib/history/queries.ts`, add `include: { tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } } }` to the `prisma.dailyTask.findMany` call. Remove `category` from the select/return.

- [ ] **Step 2: Update upcoming queries**

In `src/lib/upcoming/queries.ts`, add `include: { tags }` to the Prisma query. Remove `category`.

- [ ] **Step 3: Update recurring route mapping**

In `src/app/api/tasks/recurring/route.ts`, add `tags: t.tags` to the manual `tasks.map((t) => ({...}))` mapping.

- [ ] **Step 4: Update history client type**

In `src/lib/queries/history.ts`, replace `category: string | null` with `tags: Array<{ id: string; name: string; color: string }>` in the `HistoryTask` type.

- [ ] **Step 5: Verify cron endpoint**

Grep `src/app/api/cron/` for `category` references. Remove if found.

- [ ] **Step 6: Update history and cron tests**

Update `src/lib/history/__tests__/queries.test.ts` and `src/lib/tasks/__tests__/cron-rollover.test.ts` to remove `category` from test data and add `tags: []`.

- [ ] **Step 7: Run all tests**

Run: `pnpm test:run`
Expected: all tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/history/ src/lib/upcoming/ src/lib/queries/history.ts src/app/api/
git commit -m "refactor: include tags in history, upcoming, and cron queries"
```

---

### Task 23: Final verification

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: success with zero errors

- [ ] **Step 2: Full test suite**

Run: `pnpm test:run`
Expected: all tests pass

- [ ] **Step 3: Grep for remaining category references**

Run: `grep -r "category" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v generated`
Expected: no results (or only in migration files / comments)

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: clean up remaining category references"
```

---

## Chunk 5: Final Cleanup — Remove category

### Task 25: Remove category column

**Files:**
- Modify: `prisma/schema.prisma`
- Create: new migration

- [ ] **Step 1: Remove category from schema**

In `prisma/schema.prisma`, remove `category String?` from both `DailyTask` and `RecurringTask`.

- [ ] **Step 2: Create migration**

Run: `pnpm prisma migrate dev --name remove_category`
Expected: migration drops `category` column from both tables

- [ ] **Step 3: Generate client**

Run: `pnpm prisma generate`

- [ ] **Step 4: Grep for remaining category references**

Run grep across `src/` for `category` in `.ts` and `.tsx` files (excluding `generated/`). Fix any remaining references.

- [ ] **Step 5: Full build + test**

Run: `pnpm build && pnpm test:run`
Expected: ALL pass — zero `category` references remain in application code

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/
git commit -m "chore: remove category column from DailyTask and RecurringTask"
```

---

## DESIGN.md Updates

### Task 26: Update DESIGN.md

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Update Badges section**

Add TagBadge documentation:
- Colors use inline `style` with `TAG_COLORS` map (not Tailwind classes)
- Uses `text-xs` (not `text-tag`) to avoid `tailwind-merge` stripping
- Supports optional `onRemove` prop for × button

- [ ] **Step 2: Add TagsInput section**

Document the new component: underline input with chips + dropdown pattern.

- [ ] **Step 3: Remove category references**

Remove any mention of `category` field from component descriptions.

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md
git commit -m "docs: update DESIGN.md with tag components"
```

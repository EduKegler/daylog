# Tags System Design

Replace the single `category` field with a multi-tag system. Each tag belongs to a user (or guest), has a name and a predefined pastel color, and can be assigned to multiple tasks.

## Data Model

### New: `Tag` table

```prisma
model Tag {
  id             String   @id @default(cuid())
  userId         String?
  guestSessionId String?
  name           String
  color          String   // one of 10 predefined color keys: "rose" | "orange" | "amber" | "lime" | "emerald" | "sky" | "blue" | "violet" | "pink" | "stone"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  guestSession GuestSession? @relation(fields: [guestSessionId], references: [id], onDelete: Cascade)
  dailyTasks   DailyTask[]
  recurringTasks RecurringTask[]

  @@index([userId])
  @@index([guestSessionId])
}
```

Owner constraint: same `CHECK (num_nonnulls("userId", "guestSessionId") = 1)` pattern as `DailyTask` and `RecurringTask`.

Tag name uniqueness per owner: PostgreSQL composite unique constraints with nullable columns don't prevent duplicates when the nullable column is NULL. Instead, use **partial unique indexes** in the migration SQL:

```sql
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag" ("userId", lower("name")) WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "Tag_guestSessionId_name_key" ON "Tag" ("guestSessionId", lower("name")) WHERE "guestSessionId" IS NOT NULL;
```

This also enforces case-insensitivity at the DB level (via `lower()`). Application-level validation still normalizes to lowercase before insert.

### Limits

- Max **5 tags per task** (both daily and recurring). Prevents layout overflow.
- No limit on total tags per owner (users or guests).

### Modified: `DailyTask` and `RecurringTask`

- Remove `category String?` field from both models
- Add `tags Tag[]` many-to-many relation (Prisma implicit join tables)

### Modified: `User` and `GuestSession`

- Add `tags Tag[]` relation

### Migration strategy

Manual migration (SQL file + `prisma migrate resolve --applied`):

1. Create `Tag` table with `CHECK (num_nonnulls("userId", "guestSessionId") = 1)`
2. Create partial unique indexes for name uniqueness per owner (see above)
3. Create implicit join tables (`_DailyTaskToTag`, `_RecurringTaskToTag`)
4. Data migration (raw SQL):
   - For each unique `(userId, category)` and `(guestSessionId, category)` pair where category is not null, `INSERT INTO "Tag"` with auto-assigned color (round-robin from the 10 predefined keys)
   - `INSERT INTO "_DailyTaskToTag"` linking each `DailyTask` to its corresponding `Tag` (matched by owner + category name)
   - `INSERT INTO "_RecurringTaskToTag"` linking each `RecurringTask` to its corresponding `Tag`
5. Drop `category` column from both `DailyTask` and `RecurringTask`

The migration uses raw SQL because Prisma implicit join tables don't have exposed models — inserts must go directly into the join tables.

## Color System

10 predefined pastel colors. Stored as a string key in the `color` column. The application maps keys to bg/text hex pairs.

| Key | Background | Text |
|---|---|---|
| `rose` | `#FECDD3` | `#9F1239` |
| `orange` | `#FED7AA` | `#9A3412` |
| `amber` | `#FDE68A` | `#854D0E` |
| `lime` | `#D9F99D` | `#3F6212` |
| `emerald` | `#A7F3D0` | `#065F46` |
| `sky` | `#BAE6FD` | `#075985` |
| `blue` | `#BFDBFE` | `#1E40AF` |
| `violet` | `#E9D5FF` | `#6B21A8` |
| `pink` | `#FBCFE8` | `#9D174D` |
| `stone` | `#E7E5E4` | `#44403C` |

Defined as a constant map in `src/lib/tags/colors.ts`. The map is shared between server and client.

## API

### `GET /api/tags`

Returns all tags for the current owner, ordered by name.

Response: `{ tags: Array<{ id, name, color }> }`

### `POST /api/tags`

Creates a new tag for the current owner.

Body: `{ name: string, color: string }`

Validation:
- `name`: required, max 30 chars, trimmed, unique per owner (case-insensitive)
- `color`: required, must be one of the 10 predefined keys

Response: `{ tag: { id, name, color } }`

### `PATCH /api/tags/[id]`

Updates a tag's name or color. Only the owner can update.

Body: `{ name?: string, color?: string }`

Validation:
- `name`: if provided, max 30 chars, trimmed, must be unique per owner (case-insensitive, same rules as POST)
- `color`: if provided, must be one of the 10 predefined keys

Response: `{ tag: { id, name, color } }`

### `DELETE /api/tags/[id]`

Deletes a tag. Removes all associations with tasks (join table rows). Only the owner can delete.

### Server Actions (mutations on tasks)

`createTaskAction` and `updateTaskAction` (daily) and `createRecurringTask` and `updateRecurringTask` (recurring) accept `tagIds: string[]` instead of `category: string | null`.

**FormData encoding** (for `createTaskAction`, `createRecurringTask`): `tagIds` is serialized as a JSON string in a single FormData field: `formData.set("tagIds", JSON.stringify(tagIds))`. Server actions parse it back with `JSON.parse()`.

**Direct object** (for `updateTaskAction`, `updateRecurringTask`): `tagIds: string[]` is passed directly in the data object alongside other fields.

Validation: all tag IDs must belong to the current owner. Max 5 tags per task.

**Note on `updateDailyTask` mutation**: Currently uses `prisma.dailyTask.updateMany` which doesn't support relation operations. Must be changed to `prisma.dailyTask.update` (single record by ID) to support `tags: { set: tagIds.map(id => ({ id })) }` which replaces all current tag associations.

## React Query Integration

### New query key: add `tags` to `src/lib/queries/keys.ts`

```ts
tags: ["tags"] as const,
```

### New query: `useTags()`

- Key: `queryKeys.tags`
- Fetches `GET /api/tags`
- staleTime / gcTime: same as existing queries (5min / 10min)

### Modified: `useCreateTask()`, `useUpdateTask()`, etc.

- Accept `tagIds: string[]` in the mutation payload
- Optimistic updates include tag data from the local cache

### New mutations: `useCreateTag()`, `useUpdateTag()`, `useDeleteTag()`

- Invalidate `["tags"]` on success
- `useCreateTag` returns the created tag for immediate use in the form

## UI Components

### `TagBadge` — `src/app/components/tag-badge.tsx`

Presentational component. Renders a single tag with its color.

```tsx
type TagBadgeProps = {
  name: string;
  color: string; // color key
  onRemove?: () => void; // if provided, shows × button
};
```

Styling: `text-xs font-medium px-2 py-0.5 rounded-full` with inline `style={{ background, color }}` from the color map. Uses `text-xs` instead of `text-tag` because `tailwind-merge` strips unrecognized custom font-size tokens. The × button is a 14×14 inline SVG, opacity 0.6, hover opacity 1.

### `TagsInput` — `src/app/components/tags-input.tsx`

Client component. The main input for selecting/creating tags in the task form.

**Layout**: Container styled with underline pattern (border-bottom, no background). Selected tags render as `TagBadge` chips with × remove buttons. Inline text input follows the chips. Placeholder "Tags (optional)" when empty.

**Dropdown**: Opens on focus/typing. Shows:
1. Filtered list of owner's existing tags (excluding already-selected). Each row shows a color dot + name. Matching text is highlighted.
2. "Create tag [input]" option at the bottom if no exact match exists.

**Create flow**: Selecting "Create tag" opens an inline color picker (10 circles). User picks a color, clicks "Criar". Tag is created via `useCreateTag()`, then auto-selected.

**Keyboard**: Arrow keys navigate dropdown. Enter selects highlighted option. Backspace on empty input removes last chip.

**Props**:
```tsx
type TagsInputProps = {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
};
```

Uses `useTags()` internally to get the list of available tags.

### Modified: `TaskForm`

- Remove `category` state and input
- Add `selectedTagIds: string[]` state
- Render `<TagsInput>` in place of the category input
- Pass `tagIds` to the submit handler

### Modified: `TaskItem`

- Replace `task.category && <span className={badge}>{task.category}</span>` with mapping over `task.tags` rendering `<TagBadge>` for each

### Modified: `HistoryDayCard`

- Same change as `TaskItem` — render `TagBadge` for each tag

### Modified: `RecurringTaskList`

- Replace `task.category` badge display with `task.tags` mapped to `<TagBadge>`
- Pass tags to `TaskForm` in edit mode

### Tag ordering in UI

Tags are ordered alphabetically by name at the Prisma query level: `include: { tags: { orderBy: { name: "asc" } } }`.

## Rollover & Recurring Instances

### `ensureRecurringInstances()`

Currently uses `createMany` to generate today's daily task instances. Two problems: `createMany` can't connect many-to-many relations, and it doesn't return created record IDs.

**Strategy**: Replace `createMany` with individual `prisma.dailyTask.create()` calls inside an interactive transaction (`prisma.$transaction(async (tx) => { ... })`). Each `create` call includes `tags: { connect: recurringTask.tags.map(t => ({ id: t.id })) }`, directly linking the tags in the same operation. This requires:
1. `getActiveRecurringTasks()` must `include: { tags: { select: { id: true } } }` to fetch tag IDs
2. The transaction ensures atomicity — if any create fails, all roll back

### `processRollover()`

Currently uses `createMany` inside a batch transaction (array format). Same two problems.

**Strategy**: Refactor from batch transaction (`prisma.$transaction([...])`) to interactive transaction (`prisma.$transaction(async (tx) => { ... })`). Replace `createMany` with individual `tx.dailyTask.create()` calls that include `tags: { connect: ... }`. Source tasks must be fetched with `include: { tags: { select: { id: true } } }` to know which tags to connect.

## Guest Mode

### Data claim

`claimGuestData()` must transfer `Tag` records from guest to user. Algorithm:

1. Fetch all guest tags and all user tags (by name, lowercased)
2. For each guest tag:
   a. If user has a tag with the same name (case-insensitive): **merge** — update all join table rows (`_DailyTaskToTag`, `_RecurringTaskToTag`) that reference the guest tag to point to the user's tag instead, then delete the guest tag
   b. If no collision: **transfer** — update the guest tag's `guestSessionId → null`, `userId → user.id`
3. Join table updates use `$executeRaw` since Prisma implicit join tables have no exposed model
4. All operations run inside the existing claim transaction

### Rate limiting

No rate limit on tag creation for guests.

## Validation

### `src/lib/tags/validation.ts`

- `validateTagInput({ name, color })`: trims name, validates max 30 chars, validates color is a valid key
- `validateTagIds(tagIds, ownerId)`: verifies all IDs belong to the owner (query DB)

### `src/lib/tasks/validation.ts`

- Remove `category` from `validateCommonFields`
- Add `tagIds: string[]` to `TaskInput` and `RecurringTaskInput` types
- Validate tag IDs belong to the owner

## Serialization

### `src/lib/tasks/serialize.ts`

- Remove `category` from output
- Add `tags: Array<{ id, name, color }>` to output
- Prisma queries must `include: { tags: true }` (or `include: { tags: { select: { id: true, name: true, color: true } } }`)

## File Organization

| File | Purpose |
|---|---|
| `src/lib/tags/colors.ts` | Color map constant (shared server/client) |
| `src/lib/tags/validation.ts` | Tag input validation |
| `src/lib/tags/actions.ts` | Server actions: create, update, delete tag |
| `src/lib/tags/queries.ts` | Prisma queries for tags |
| `src/lib/queries/tags.ts` | React Query hooks: `useTags()`, `useCreateTag()`, `useUpdateTag()`, `useDeleteTag()` |
| `src/app/api/tags/route.ts` | GET, POST endpoints |
| `src/app/api/tags/[id]/route.ts` | PATCH, DELETE endpoints |
| `src/app/components/tag-badge.tsx` | Presentational tag chip |
| `src/app/components/tags-input.tsx` | Tags input with dropdown + create flow |

## Testing

- `src/lib/tags/__tests__/validation.test.ts` — tag name/color validation, edge cases
- `src/lib/tags/__tests__/queries.test.ts` — CRUD operations, owner isolation
- `src/lib/tags/__tests__/actions.test.ts` — server action integration
- `src/lib/tasks/__tests__/validation.test.ts` — update existing tests to remove category, add tagIds
- `src/lib/tasks/__tests__/mutations.test.ts` — update for tags relation

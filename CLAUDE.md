# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # prisma generate && next build
pnpm test             # Vitest watch mode
pnpm test:run         # Vitest single run
pnpm lint             # Next.js lint
pnpm lighthouse       # Lighthouse CI audit (uses .lighthouserc.js)
```

Run a single test file:
```bash
pnpm vitest run src/lib/tasks/__tests__/validation.test.ts
```

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Prisma 7 (PrismaPg adapter) + NextAuth v5 (Google OAuth, JWT strategy) + React Query (TanStack Query v5)

**Package manager**: pnpm (`packageManager` field in package.json)

### Data flow

- **Pages** are thin Server Component wrappers (header, nav) that render Client Components for dynamic content
- **Data fetching** uses React Query hooks (`src/lib/queries/`) that call API routes (`src/app/api/tasks/`) → Prisma queries
- **Mutations** go through React Query `useMutation` hooks that call Server Actions in `src/app/actions.ts` (daily tasks) and `src/lib/tasks/actions.ts` (recurring tasks), with optimistic cache updates and automatic invalidation
- **Validation** runs server-side in `src/lib/tasks/validation.ts` before any mutation
- **Cache**: React Query provides client-side SWR cache (staleTime: 5min, gcTime: 10min), eliminating redundant skeletons on navigation

### Daily rollover system

The core domain logic — handles task carryover between days:

1. `ensureRecurringInstances()` — called on page load, generates today's recurring task instances if missing
2. `processRollover()` — moves pending manual tasks from yesterday to today (marks as carry-over), skips pending recurring tasks from yesterday
3. `/api/cron/rollover` — POST endpoint (requires `CRON_SECRET` header) that runs rollover for all users daily

### Recurring task editing & deletion

- **Editing from daily view or /recurring**: updates the `RecurringTask` template, then `syncPendingRecurringInstances()` propagates title, description, and tags to all PENDING `DailyTask` instances
- **Deleting a recurring instance**: soft-deletes by setting `status: "DISMISSED"` (preserves the `recurringTaskId` link so `ensureRecurringInstances` won't recreate it). Manual tasks are hard-deleted.
- **DISMISSED status**: filtered out from daily view, history, and stats queries. Cannot be completed or edited.

### Key paths

| Area | Path |
|---|---|
| React Query hooks | `src/lib/queries/` |
| API routes (data fetching) | `src/app/api/tasks/` |
| Query key factory | `src/lib/queries/keys.ts` |
| QueryClient provider | `src/app/providers.tsx` |
| Task serialization | `src/lib/tasks/serialize.ts` |
| Server Actions (daily tasks) | `src/app/actions.ts` |
| Server Actions (recurring) | `src/lib/tasks/actions.ts` |
| Task business logic | `src/lib/tasks/` |
| Auth config & session | `src/lib/auth/` |
| Prisma client singleton | `src/lib/db/prisma.ts` |
| Database schema | `prisma/schema.prisma` |
| Middleware (auth guard) | `src/proxy.ts` |
| CSS & design tokens | `src/app/globals.css` |
| Class merge utility | `src/lib/cn.ts` |
| Task form (unified) | `src/app/components/task-form/` |
| Text primitive | `src/app/components/text.tsx` |

### Import alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

### Prisma

Uses `@prisma/adapter-pg` (PrismaPg) with connection string from `DATABASE_URL`. The Prisma client is generated to `src/generated/prisma/`. Always run `prisma generate` before build (already in the build script).

### Auth & Guest Sessions

NextAuth v5 with Google provider, JWT strategy, PrismaAdapter. Session includes `user.id` and `user.timezone`. User timezone defaults to `America/Sao_Paulo`. Auth middleware lives in `src/proxy.ts`.

**Guest mode**: Unauthenticated users can use the app immediately. Guest sessions are stored in `GuestSession` table with a 30-day TTL. When a guest logs in, their data is atomically transferred to the user account via `claimGuestData()`.

- **Owner abstraction**: `OwnerContext` (discriminated union: `user` | `guest`) and `OwnerFilter` (`{ userId }` | `{ guestSessionId }`) in `src/lib/auth/owner-context.ts`
- **Resolution**: `resolveOwnerContext()` for reads (returns null if no session), `resolveWriteContext()` for writes (creates guest session if needed)
- **Claim**: On first authenticated request with a guest cookie, data is claimed automatically inside `resolveOwnerContext()`
- **Rate limiting**: In-memory rate limiter for guests (20 daily tasks/day, 5 recurring total) in `src/lib/guest/rate-limiter.ts`
- **Rollover**: Guests get lazy rollover on `/api/tasks/daily` GET; cron only processes registered Users
- **Protected routes**: Only `/profile` requires authentication; all other routes work for guests
- **DB constraint**: `CHECK (num_nonnulls("userId", "guestSessionId") = 1)` on `DailyTask` and `RecurringTask`

| Area | Path |
|---|---|
| Guest constants & quotas | `src/lib/guest/constants.ts` |
| Guest session CRUD | `src/lib/guest/session.ts` |
| Guest data claim | `src/lib/guest/claim.ts` |
| Guest rate limiter | `src/lib/guest/rate-limiter.ts` |
| Owner context types & resolution | `src/lib/auth/owner-context.ts` |
| Timezone detector (client) | `src/app/components/timezone-detector.tsx` |

## Styling

All styles live inline as Tailwind utilities in TSX files. No CSS custom classes — `globals.css` only has `@theme` tokens (including animation tokens), `@keyframes` for component animations, base element styles, and one `@media (hover: none)` rule using `[data-action-btn]`.

Use `cn()` from `@/lib/cn` (`clsx` + `tailwind-merge`) for conditional classes:
```tsx
import { cn } from "@/lib/cn";
<div className={cn("base-classes", isActive && "extra-classes")} />
```

**`tailwind-merge` caveat:** Custom `@theme` font-size tokens (e.g. `text-tag`) are NOT recognized by `tailwind-merge`. Combining them with other `text-*` utilities (like `text-right`, `text-muted`) causes the custom class to be silently stripped. Use standard Tailwind size classes (`text-xs`, `text-sm`, etc.) when passing through `cn()`.

## Design System

See **DESIGN.md** at the project root for the complete visual spec (colors, typography, spacing, component patterns). Any frontend work MUST follow that file.

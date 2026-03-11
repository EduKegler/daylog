# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # prisma generate && next build
pnpm test             # Vitest watch mode
pnpm test:run         # Vitest single run
pnpm lint             # Next.js lint
```

Run a single test file:
```bash
pnpm vitest run src/lib/tasks/__tests__/validation.test.ts
```

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Prisma 7 (PrismaPg adapter) + NextAuth v5 (Google OAuth, JWT strategy)

**Package manager**: pnpm (`packageManager` field in package.json)

### Data flow

- **Pages** are Server Components that fetch data via `getCurrentUser()` + Prisma queries
- **Mutations** go through Server Actions in `src/app/actions.ts` (daily tasks) and `src/lib/tasks/actions.ts` (recurring tasks)
- **Client Components** (`src/app/components/`) use `useTransition()` to call server actions with optimistic UI
- **Validation** runs server-side in `src/lib/tasks/validation.ts` before any mutation

### Daily rollover system

The core domain logic — handles task carryover between days:

1. `ensureRecurringInstances()` — called on page load, generates today's recurring task instances if missing
2. `processRollover()` — moves pending manual tasks from yesterday to today (marks as carry-over), skips pending recurring tasks from yesterday
3. `/api/cron/rollover` — POST endpoint (requires `CRON_SECRET` header) that runs rollover for all users daily

### Key paths

| Area | Path |
|---|---|
| Server Actions (daily tasks) | `src/app/actions.ts` |
| Server Actions (recurring) | `src/lib/tasks/actions.ts` |
| Task business logic | `src/lib/tasks/` |
| Auth config & session | `src/lib/auth/` |
| Prisma client singleton | `src/lib/db/prisma.ts` |
| Database schema | `prisma/schema.prisma` |
| Middleware (auth guard) | `src/proxy.ts` |
| CSS & design tokens | `src/app/globals.css` |
| Text primitive | `src/app/components/text.tsx` |

### Import alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

### Prisma

Uses `@prisma/adapter-pg` (PrismaPg) with connection string from `DATABASE_URL`. The Prisma client is generated to `src/generated/prisma/`. Always run `prisma generate` before build (already in the build script).

### Auth

NextAuth v5 with Google provider, JWT strategy, PrismaAdapter. Session includes `user.id` and `user.timezone`. User timezone defaults to `America/Sao_Paulo`. Auth middleware lives in `src/proxy.ts`.

## Design System

See **DESIGN.md** at the project root for the complete visual spec (colors, typography, spacing, component patterns). Any frontend work MUST follow that file.

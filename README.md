# Daylog

Personal daily task manager with support for recurring tasks, tags, automatic rollover, guest mode, and history.

## Stack

- **Next.js 16** — App Router, Server Components, Server Actions
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Prisma 7** — PrismaPg adapter + PostgreSQL (Supabase)
- **NextAuth** (Auth.js v5) — Google OAuth, JWT strategy
- **React Query** (TanStack Query v5) — client-side SWR cache
- **Zod** — runtime validation at system boundaries

## Architecture

- **Server Components** for pages (dashboard, history, recurring)
- **Client Components** for interaction (forms, toggles, buttons)
- **Server Actions** for mutations (create, edit, complete, toggle)
- **React Query** hooks for data fetching via API routes, with optimistic updates
- **Prisma** as ORM with PostgreSQL

## Data Model

### Entities

- **User** — authentication via OAuth (Google)
- **GuestSession** — anonymous session with 30-day TTL, data claimed on login
- **RecurringTask** — recurring task template (DAILY, WEEKDAYS, SPECIFIC_WEEKDAYS, MONTHLY)
- **DailyTask** — concrete task instance for a specific day
- **Tag** — colored label, assignable to both daily and recurring tasks

### Task Status

| Status | Meaning |
|--------|---------|
| `PENDING` | Task awaiting completion |
| `COMPLETED` | Task completed |
| `SKIPPED` | Recurring task skipped during rollover (was left pending on the previous day) |
| `DISMISSED` | Soft-deleted recurring instance (filtered from all views) |

### Source types

- `RECURRING` — automatically generated from RecurringTask
- `MANUAL` — created directly by the user

## How rollover works

1. At the start of each day, the system checks for pending tasks from previous days
2. Pending **manual** tasks are moved to the current day (carry-over), preserving the `originalDate`
3. Pending **recurring** tasks are marked as `SKIPPED` (since a new instance will be generated)
4. New recurring instances are created via `ensureRecurringInstances`

Registered users are processed by a daily cron job (`/api/cron/rollover`). Guests get lazy rollover on page load.

## Guest mode

Unauthenticated users can use the app immediately. Guest sessions are stored with a 30-day TTL. When a guest logs in via Google OAuth, their data is atomically transferred to the authenticated account.

## Running locally

```bash
# Clone
git clone <repo-url> && cd daylog

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your OAuth credentials, CRON_SECRET, and DATABASE_URL (PostgreSQL)

# Create the database and run migrations
pnpm prisma migrate dev

# Start the development server
pnpm dev
```

## Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name migration-name

# Apply migrations in production
pnpm prisma migrate deploy
```

## Tests

```bash
# Watch mode
pnpm test

# Run once
pnpm test:run

# With coverage
pnpm vitest run --coverage
```

## Limitations

- No notifications (push/email)
- No drag-and-drop for reordering tasks
- No subtasks or task dependencies

## Next steps

- Streak and metrics visualization
- Themes (dark/light mode)
- PWA with offline support (service worker)

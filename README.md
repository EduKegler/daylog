# Daylog

Personal daily task manager with support for recurring tasks, automatic rollover, and history.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7** + SQLite
- **NextAuth** (Auth.js v5)

## Architecture

- **Server Components** for pages (dashboard, history, recurring)
- **Client Components** for interaction (forms, toggles, buttons)
- **Server Actions** for mutations (create task, complete, toggle)
- **Prisma** as ORM with local SQLite

## Data Model

### Entities

- **User** — authentication via OAuth (Google)
- **RecurringTask** — recurring task template (DAILY, WEEKDAYS, SPECIFIC_WEEKDAYS, MONTHLY)
- **DailyTask** — concrete task instance for a specific day

### Task Status

| Status | Meaning |
|--------|---------|
| `PENDING` | Task awaiting completion |
| `COMPLETED` | Task completed |
| `SKIPPED` | Recurring task skipped during rollover (was left pending on the previous day) |

### Source types

- `RECURRING` — automatically generated from RecurringTask
- `MANUAL` — created directly by the user

## How rollover works

1. At the start of each day, the system checks for pending tasks from previous days
2. Pending **manual** tasks are moved to the current day (carry-over), preserving the `originalDate`
3. Pending **recurring** tasks are marked as `SKIPPED` (since a new instance will be generated)
4. New recurring instances are created via `ensureRecurringInstances`

## Running locally

```bash
# Clone
git clone <repo-url> && cd daylog

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your OAuth credentials and secret

# Create the database and run migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

## Migrations and seed

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Seed (if available)
npx prisma db seed
```

## Tests

```bash
# Watch mode
npm test

# Run once
npm run test:run

# With coverage
npx vitest run --coverage
```

## MVP Limitations

- UX optimized for single-user (no multi-tenant)
- No notifications (push/email)
- No mobile-first design
- No drag-and-drop for reordering tasks
- No subtasks or task dependencies

## Next steps

- Edit manual tasks
- Notes/comments per task
- Streak and metrics visualization
- Themes (dark/light mode)
- PWA for offline use

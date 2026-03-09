# Migração SQLite → PostgreSQL + Cron Rollover

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrar o banco de SQLite (local) para PostgreSQL (VPS) e criar endpoint de cron para rollover automático diário.

**Architecture:** O Next.js na Vercel conecta diretamente ao Postgres na VPS via connection string. Um crontab na VPS chama o endpoint `/api/cron/rollover` a cada hora para processar a virada de dia de cada usuário conforme seu timezone.

**Tech Stack:** PostgreSQL 16, Prisma (provider nativo), Docker Compose, crontab

---

## Parte 1: Código (Daylog)

### Task 1: Trocar provider do Prisma para PostgreSQL

**Files:**
- Modify: `prisma/schema.prisma:6-8`
- Modify: `src/lib/db/prisma.ts` (reescrever)
- Modify: `package.json` (remover deps SQLite)

**Step 1: Atualizar schema.prisma**

Trocar o datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 2: Simplificar prisma.ts**

Remover o adapter `better-sqlite3`. Postgres funciona nativamente com Prisma:

```ts
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Step 3: Remover dependências SQLite**

```bash
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3
```

**Step 4: Atualizar .env.example**

Trocar `DATABASE_URL` de SQLite para Postgres:

```
DATABASE_URL="postgresql://daylog:SENHA@VPS_IP:5432/daylog"
```

**Step 5: Regenerar Prisma client**

```bash
npx prisma generate
```

**Step 6: Verificar build**

```bash
npm run build
```

Expected: Build passa sem erros.

**Step 7: Commit**

```bash
git add prisma/schema.prisma src/lib/db/prisma.ts package.json package-lock.json .env.example src/generated/
git commit -m "feat: migrate from SQLite to PostgreSQL"
```

---

### Task 2: Criar endpoint de cron para rollover

**Files:**
- Create: `src/app/api/cron/rollover/route.ts`
- Modify: `.env.example` (adicionar CRON_SECRET)

**Step 1: Criar o route handler**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { processRollover } from "@/lib/tasks/rollover";
import { ensureRecurringInstances } from "@/lib/tasks/ensure-recurring-instances";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, timezone: true, lastProcessedDate: true },
  });

  const results = [];

  for (const user of users) {
    const today = getUserLocalDate(user.timezone);

    if (!user.lastProcessedDate || user.lastProcessedDate.getTime() < today.getTime()) {
      const rollover = await processRollover(user.id, user.lastProcessedDate, today);
      await ensureRecurringInstances(user.id, today);
      results.push({ userId: user.id, carriedOver: rollover.carriedOver });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
```

**Step 2: Adicionar CRON_SECRET ao .env.example**

Adicionar ao final:

```
# Cron rollover (token de autenticação)
CRON_SECRET=
```

**Step 3: Verificar build**

```bash
npm run build
```

Expected: Build passa, rota `/api/cron/rollover` aparece na lista.

**Step 4: Commit**

```bash
git add src/app/api/cron/rollover/route.ts .env.example
git commit -m "feat: add cron endpoint for daily rollover"
```

---

## Parte 2: Infraestrutura (VPS)

### Task 3: Provisionar Postgres na VPS

**Files (na VPS):**
- Create: `~/daylog/docker-compose.yml`
- Create: `~/daylog/.env`

**Step 1: Criar docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U daylog"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  pgdata:
```

**Step 2: Criar .env**

```
POSTGRES_USER=daylog
POSTGRES_PASSWORD=<gerar senha forte>
POSTGRES_DB=daylog
```

**Step 3: Subir o container**

```bash
cd ~/daylog && docker compose up -d
```

**Step 4: Verificar conexão**

```bash
docker compose exec postgres psql -U daylog -c "SELECT 1"
```

Expected: Retorna `1`.

**Step 5: Rodar migration do Prisma (da máquina local, apontando pra VPS)**

```bash
DATABASE_URL="postgresql://daylog:SENHA@VPS_IP:5432/daylog" npx prisma db push
```

Expected: Schema criado sem erros.

---

### Task 4: Configurar crontab na VPS

**Step 1: Gerar CRON_SECRET**

```bash
openssl rand -hex 32
```

Guardar o valor — vai precisar configurar tanto na Vercel (env var) quanto no crontab.

**Step 2: Adicionar crontab**

```bash
crontab -e
```

Adicionar:

```cron
0 * * * * curl -s -X POST https://DAYLOG_URL/api/cron/rollover -H "Authorization: Bearer CRON_SECRET_VALUE" >> ~/daylog/cron.log 2>&1
```

Roda a cada hora cheia. Cada execução processa apenas os usuários cuja meia-noite local já passou.

**Step 3: Verificar crontab**

```bash
crontab -l
```

Expected: Linha do curl aparece.

---

## Verificação Final

1. Deploy na Vercel com `DATABASE_URL` e `CRON_SECRET` configurados nas env vars
2. Acessar o app — login, criar task, completar task
3. Chamar manualmente o cron: `curl -X POST https://DAYLOG_URL/api/cron/rollover -H "Authorization: Bearer TOKEN"`
4. Verificar resposta JSON com `processed` e `results`

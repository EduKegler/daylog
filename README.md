# Daylog

Gerenciador pessoal de tarefas diárias com suporte a tarefas recorrentes, rollover automático e histórico.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7** + SQLite
- **NextAuth** (Auth.js v5)

## Arquitetura

- **Server Components** para páginas (dashboard, histórico, recorrentes)
- **Client Components** para interação (forms, toggles, botões)
- **Server Actions** para mutações (criar tarefa, completar, toggle)
- **Prisma** como ORM com SQLite local

## Modelagem

### Entidades

- **User** — autenticação via OAuth (Google)
- **RecurringTask** — template de tarefa recorrente (DAILY, WEEKDAYS, SPECIFIC_WEEKDAYS, MONTHLY)
- **DailyTask** — instância concreta de tarefa para um dia específico

### Status de tarefa

| Status | Significado |
|--------|-------------|
| `PENDING` | Tarefa aguardando conclusão |
| `COMPLETED` | Tarefa concluída |
| `SKIPPED` | Tarefa recorrente pulada no rollover (ficou pendente no dia anterior) |

### Source types

- `RECURRING` — gerada automaticamente a partir de RecurringTask
- `MANUAL` — criada diretamente pelo usuário

## Como funciona o rollover

1. No início de cada dia, o sistema verifica se existem tarefas pendentes de dias anteriores
2. Tarefas **manuais** pendentes são movidas para o dia atual (carry-over), preservando a `originalDate`
3. Tarefas **recorrentes** pendentes são marcadas como `SKIPPED` (pois uma nova instância será gerada)
4. Novas instâncias de recorrentes são criadas via `ensureRecurringInstances`

## Rodando localmente

```bash
# Clone
git clone <repo-url> && cd daylog

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais OAuth e secret

# Crie o banco e rode migrações
npx prisma migrate dev

# Inicie o servidor de desenvolvimento
npm run dev
```

## Migrações e seed

```bash
# Criar nova migração
npx prisma migrate dev --name nome-da-migracao

# Seed (se disponível)
npx prisma db seed
```

## Testes

```bash
# Modo watch
npm test

# Rodar uma vez
npm run test:run

# Com cobertura
npx vitest run --coverage
```

## Limitações do MVP

- UX otimizada para single-user (sem multi-tenant)
- Sem notificações (push/email)
- Sem mobile-first design
- Sem drag-and-drop para reordenar tarefas
- Sem subtarefas ou dependências entre tarefas

## Próximos passos

- Edição de tarefas manuais
- Notas/comentários por tarefa
- Visualização de streaks e métricas
- Temas (dark/light mode)
- PWA para uso offline

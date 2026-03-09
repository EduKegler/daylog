import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "teste@daylog.dev" },
    update: {},
    create: {
      email: "teste@daylog.dev",
      name: "Usuário Teste",
      timezone: "America/Sao_Paulo",
    },
  });

  console.log("Usuário criado:", user.email);

  await prisma.recurringTask.deleteMany({ where: { userId: user.id } });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Revisar e-mails",
      category: "Trabalho",
      recurrenceType: "DAILY",
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Standup meeting",
      description: "Reunião diária do time",
      category: "Trabalho",
      recurrenceType: "WEEKDAYS",
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Revisão semanal",
      description: "Revisar progresso da semana",
      category: "Pessoal",
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [5] }),
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Pagar contas",
      category: "Finanças",
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ dayOfMonth: 10 }),
    },
  });

  console.log("Tarefas recorrentes criadas:", 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyTask.deleteMany({ where: { userId: user.id } });

  await prisma.dailyTask.createMany({
    data: [
      {
        userId: user.id,
        sourceType: "RECURRING",
        title: "Revisar e-mails",
        category: "Trabalho",
        scheduledDate: today,
        status: "PENDING",
      },
      {
        userId: user.id,
        sourceType: "MANUAL",
        title: "Comprar café",
        category: "Pessoal",
        scheduledDate: today,
        status: "PENDING",
      },
    ],
  });

  console.log("Tarefas diárias criadas:", 2);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

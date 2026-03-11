import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@daylog.dev" },
    update: {},
    create: {
      email: "test@daylog.dev",
      name: "Test User",
      timezone: "America/Sao_Paulo",
    },
  });

  console.log("User created:", user.email);

  await prisma.recurringTask.deleteMany({ where: { userId: user.id } });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Review emails",
      category: "Work",
      recurrenceType: "DAILY",
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Standup meeting",
      description: "Daily team meeting",
      category: "Work",
      recurrenceType: "WEEKDAYS",
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Weekly review",
      description: "Review the week's progress",
      category: "Personal",
      recurrenceType: "SPECIFIC_WEEKDAYS",
      recurrenceConfig: JSON.stringify({ days: [5] }),
    },
  });

  await prisma.recurringTask.create({
    data: {
      userId: user.id,
      title: "Pay bills",
      category: "Finance",
      recurrenceType: "MONTHLY",
      recurrenceConfig: JSON.stringify({ daysOfMonth: [10] }),
    },
  });

  console.log("Recurring tasks created:", 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyTask.deleteMany({ where: { userId: user.id } });

  await prisma.dailyTask.createMany({
    data: [
      {
        userId: user.id,
        sourceType: "RECURRING",
        title: "Review emails",
        category: "Work",
        scheduledDate: today,
        status: "PENDING",
      },
      {
        userId: user.id,
        sourceType: "MANUAL",
        title: "Buy coffee",
        category: "Personal",
        scheduledDate: today,
        status: "PENDING",
      },
    ],
  });

  console.log("Daily tasks created:", 2);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

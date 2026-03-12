-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DailyTaskToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DailyTaskToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RecurringTaskToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecurringTaskToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE INDEX "Tag_guestSessionId_idx" ON "Tag"("guestSessionId");

-- CreateIndex
CREATE INDEX "_DailyTaskToTag_B_index" ON "_DailyTaskToTag"("B");

-- CreateIndex
CREATE INDEX "_RecurringTaskToTag_B_index" ON "_RecurringTaskToTag"("B");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyTaskToTag" ADD CONSTRAINT "_DailyTaskToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyTaskToTag" ADD CONSTRAINT "_DailyTaskToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecurringTaskToTag" ADD CONSTRAINT "_RecurringTaskToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "RecurringTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecurringTaskToTag" ADD CONSTRAINT "_RecurringTaskToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Owner constraint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_owner_check" CHECK (num_nonnulls("userId", "guestSessionId") = 1);

-- Data migration: convert existing category values to tags
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

-- Link DailyTasks to their tags
INSERT INTO "_DailyTaskToTag" ("A", "B")
SELECT dt."id", t."id"
FROM "DailyTask" dt
JOIN "Tag" t ON (
  (dt."userId" IS NOT NULL AND dt."userId" = t."userId" AND lower(trim(dt."category")) = t."name")
  OR
  (dt."guestSessionId" IS NOT NULL AND dt."guestSessionId" = t."guestSessionId" AND lower(trim(dt."category")) = t."name")
)
WHERE dt."category" IS NOT NULL AND trim(dt."category") != '';

-- Link RecurringTasks to their tags
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

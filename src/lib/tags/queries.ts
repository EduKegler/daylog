import { prisma } from "@/lib/db/prisma";
import type { OwnerFilter } from "@/lib/auth/owner-context";

const tagSelect = { id: true, name: true, color: true } as const;

export type TagRecord = {
  id: string;
  name: string;
  color: string;
};

export async function getTagsByOwner(filter: OwnerFilter): Promise<TagRecord[]> {
  return prisma.tag.findMany({
    where: filter,
    select: tagSelect,
    orderBy: { name: "asc" },
  });
}

export async function getTagById(id: string, filter: OwnerFilter): Promise<TagRecord | null> {
  return prisma.tag.findFirst({
    where: { id, ...filter },
    select: tagSelect,
  });
}

export async function createTag(filter: OwnerFilter, name: string, color: string): Promise<TagRecord> {
  return prisma.tag.create({
    data: { ...filter, name, color },
    select: tagSelect,
  });
}

export async function updateTag(id: string, data: { name?: string; color?: string }): Promise<TagRecord> {
  return prisma.tag.update({
    where: { id },
    data,
    select: tagSelect,
  });
}

export async function deleteTag(id: string): Promise<void> {
  await prisma.tag.delete({ where: { id } });
}

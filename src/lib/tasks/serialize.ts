import type { Task } from "@/app/components/task-item";

type SerializableTask = {
  id: string;
  title: string;
  description: string | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  sourceType: string;
  status: string;
  originalDate: Date | null;
  scheduledDate: Date;
  recurringTask?: {
    id: string;
    recurrenceType: string;
    recurrenceConfig: string | null;
  } | null;
};

export function serializeTask(t: SerializableTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    tags: t.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })) ?? [],
    sourceType: t.sourceType as Task["sourceType"],
    status: t.status as Task["status"],
    originalDate: t.originalDate?.toISOString() ?? null,
    scheduledDate: t.scheduledDate.toISOString(),
    recurringTaskId: t.recurringTask?.id ?? null,
    recurrenceType: t.recurringTask?.recurrenceType ?? null,
    recurrenceConfig: t.recurringTask?.recurrenceConfig ?? null,
  };
}

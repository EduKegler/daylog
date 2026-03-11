import type { Task } from "@/app/components/task-item";

type SerializableTask = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sourceType: string;
  status: string;
  originalDate: Date | null;
  scheduledDate: Date;
};

export function serializeTask(t: SerializableTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    sourceType: t.sourceType as Task["sourceType"],
    status: t.status as Task["status"],
    originalDate: t.originalDate?.toISOString() ?? null,
    scheduledDate: t.scheduledDate.toISOString(),
  };
}

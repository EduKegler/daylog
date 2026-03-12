"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  createRecurringTask,
  toggleRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
} from "@/lib/tasks/actions";

export type RecurringTask = {
  id: string;
  title: string;
  description: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  recurrenceType: string;
  recurrenceConfig: string | null;
  isActive: boolean;
};

export function useRecurringTasks(): ReturnType<typeof useQuery<RecurringTask[]>> {
  return useQuery({
    queryKey: queryKeys.recurring(),
    queryFn: async () => {
      const res = await fetch("/api/tasks/recurring");
      if (!res.ok) throw new Error("Failed to fetch recurring tasks");
      return res.json() as Promise<RecurringTask[]>;
    },
  });
}

export function useCreateRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createRecurringTask(formData),
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring() });
      const previous = queryClient.getQueryData<RecurringTask[]>(queryKeys.recurring());

      if (previous) {
        const optimistic: RecurringTask = {
          id: `temp-${Date.now()}`,
          title: (formData.get("title") as string) ?? "",
          description: (formData.get("description") as string) || null,
          tags: (() => {
            const tagIds = JSON.parse(formData.get("tagIds") as string || "[]") as string[];
            const allTags = queryClient.getQueryData<import("./tags").Tag[]>(queryKeys.tags());
            return allTags?.filter(t => tagIds.includes(t.id)) ?? [];
          })(),
          recurrenceType: (formData.get("recurrenceType") as string) ?? "DAILY",
          recurrenceConfig: (formData.get("recurrenceConfig") as string) || null,
          isActive: true,
        };

        queryClient.setQueryData<RecurringTask[]>(queryKeys.recurring(), [
          optimistic,
          ...previous,
        ]);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.recurring(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
    },
  });
}

export function useToggleRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => toggleRecurringTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring() });
      const previous = queryClient.getQueryData<RecurringTask[]>(queryKeys.recurring());

      if (previous) {
        queryClient.setQueryData<RecurringTask[]>(
          queryKeys.recurring(),
          previous.map((t) =>
            t.id === taskId ? { ...t, isActive: !t.isActive } : t,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.recurring(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
    },
  });
}

export function useUpdateRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, formData }: { taskId: string; formData: FormData }) =>
      updateRecurringTask(taskId, formData),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
    },
  });
}

export function useDeleteRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteRecurringTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring() });
      const previous = queryClient.getQueryData<RecurringTask[]>(queryKeys.recurring());

      if (previous) {
        queryClient.setQueryData<RecurringTask[]>(
          queryKeys.recurring(),
          previous.filter((t) => t.id !== taskId),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.recurring(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
    },
  });
}

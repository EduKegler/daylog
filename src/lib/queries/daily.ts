"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  createTaskAction,
  completeTaskAction,
  uncompleteTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions";

import type { Task } from "@/app/components/task-item";

type DailyTasksResponse = {
  today: string;
  tasks: Task[];
};

export function useDailyTasks(): ReturnType<typeof useQuery<DailyTasksResponse>> {
  return useQuery({
    queryKey: queryKeys.daily(),
    queryFn: async () => {
      const res = await fetch("/api/tasks/daily");
      if (!res.ok) throw new Error("Failed to fetch daily tasks");
      return res.json() as Promise<DailyTasksResponse>;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createTaskAction(formData),
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily() });
      const previous = queryClient.getQueryData<DailyTasksResponse>(queryKeys.daily());

      if (previous) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          title: (formData.get("title") as string) ?? "",
          description: null,
          tags: (() => {
            const tagIds = JSON.parse(formData.get("tagIds") as string || "[]") as string[];
            const allTags = queryClient.getQueryData<import("./tags").Tag[]>(queryKeys.tags());
            return allTags?.filter(t => tagIds.includes(t.id)) ?? [];
          })(),
          sourceType: "MANUAL",
          status: "PENDING",
          originalDate: null,
          scheduledDate: previous.today,
          recurringTaskId: null,
          recurrenceType: null,
          recurrenceConfig: null,
        };

        queryClient.setQueryData<DailyTasksResponse>(queryKeys.daily(), {
          ...previous,
          tasks: [...previous.tasks, optimisticTask],
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.daily(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcoming() });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTaskAction(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily() });
      const previous = queryClient.getQueryData<DailyTasksResponse>(queryKeys.daily());

      if (previous) {
        queryClient.setQueryData<DailyTasksResponse>(queryKeys.daily(), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "COMPLETED" } : t,
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.daily(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => uncompleteTaskAction(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily() });
      const previous = queryClient.getQueryData<DailyTasksResponse>(queryKeys.daily());

      if (previous) {
        queryClient.setQueryData<DailyTasksResponse>(queryKeys.daily(), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "PENDING" } : t,
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.daily(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  type UpdateVars = {
    taskId: string;
    data: {
      title: string;
      description: string | null;
      tagIds: string[];
      scheduledDate?: string;
    };
  };

  return useMutation({
    mutationFn: ({ taskId, data }: UpdateVars) => updateTaskAction(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily() });
      const previous = queryClient.getQueryData<DailyTasksResponse>(queryKeys.daily());

      if (previous) {
        const allTags = queryClient.getQueryData<import("./tags").Tag[]>(queryKeys.tags());
        const tags = allTags?.filter(t => data.tagIds.includes(t.id)) ?? [];
        queryClient.setQueryData<DailyTasksResponse>(queryKeys.daily(), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t.id === taskId ? { ...t, title: data.title, description: data.description, tags, scheduledDate: data.scheduledDate ?? t.scheduledDate } : t,
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.daily(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcoming() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTaskAction(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.daily() });
      const previous = queryClient.getQueryData<DailyTasksResponse>(queryKeys.daily());

      if (previous) {
        queryClient.setQueryData<DailyTasksResponse>(queryKeys.daily(), {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== taskId),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.daily(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.daily() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcoming() });
    },
  });
}

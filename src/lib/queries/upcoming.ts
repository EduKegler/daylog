"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";

import type { Task } from "@/app/components/task-item";

export type UpcomingDay = {
  date: string;
  tasks: Task[];
};

type UpcomingResponse = {
  today: string;
  days: UpcomingDay[];
};

export function useUpcomingTasks(): ReturnType<typeof useQuery<UpcomingResponse>> {
  return useQuery({
    queryKey: queryKeys.upcoming(),
    queryFn: async () => {
      const res = await fetch("/api/tasks/upcoming");
      if (!res.ok) throw new Error("Failed to fetch upcoming tasks");
      return res.json() as Promise<UpcomingResponse>;
    },
  });
}

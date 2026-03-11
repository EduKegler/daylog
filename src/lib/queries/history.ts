"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "./keys";

import type { Task } from "@/app/components/task-item";
import type { DayStats } from "@/lib/stats/day-stats";

export type HistoryDay = {
  date: string;
  tasks: Task[];
  stats: DayStats;
};

type HistoryResponse = {
  days: HistoryDay[];
  hasMore: boolean;
};

export function useHistory(page: number): ReturnType<typeof useQuery<HistoryResponse>> {
  return useQuery({
    queryKey: queryKeys.history(page),
    queryFn: async () => {
      const res = await fetch(`/api/tasks/history?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json() as Promise<HistoryResponse>;
    },
    placeholderData: keepPreviousData,
  });
}

type TaskForStats = {
  status: "PENDING" | "COMPLETED" | "SKIPPED";
};

export type DayStats = {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
};

export function computeDayStats(tasks: TaskForStats[]): DayStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const completionRate = total > 0 ? completed / total : 0;

  return { total, completed, pending, completionRate };
}

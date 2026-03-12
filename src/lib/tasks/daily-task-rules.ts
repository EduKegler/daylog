type DailyTaskInfo = {
  status: "PENDING" | "COMPLETED" | "SKIPPED" | "DISMISSED";
  sourceType: "MANUAL" | "RECURRING";
};

export function canEditDailyTask(task: DailyTaskInfo): boolean {
  return task.status === "PENDING";
}

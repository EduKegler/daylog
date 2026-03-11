import { useState } from "react";
import { useCreateTask, useUpdateTask } from "@/lib/queries/daily";
import {
  useCreateRecurringTask,
  useUpdateRecurringTask,
} from "@/lib/queries/recurring";
import type { ActionResult } from "@/lib/tasks/actions";
import type { TaskType, RecurrenceTypeValue } from "./types";

type SubmitParams = {
  mode: "create" | "edit";
  taskType: TaskType;
  taskId?: string;
  title: string;
  description: string;
  category: string;
  scheduledDate: string;
  recurrenceType: RecurrenceTypeValue;
  selectedDays: number[];
  daysOfMonth: number[];
  onSuccess: () => void;
};

function buildRecurrenceConfig(
  recurrenceType: RecurrenceTypeValue,
  selectedDays: number[],
  daysOfMonth: number[],
): string | null {
  if (recurrenceType === "SPECIFIC_WEEKDAYS") {
    return JSON.stringify({ days: selectedDays });
  }
  if (recurrenceType === "MONTHLY") {
    const sorted = [...new Set(daysOfMonth)].sort((a, b) => a - b);
    return JSON.stringify({ daysOfMonth: sorted });
  }
  return null;
}

export function useTaskFormSubmit(): {
  submit: (params: SubmitParams) => void;
  isPending: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
} {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createRecurring = useCreateRecurringTask();
  const updateRecurring = useUpdateRecurringTask();

  const isPending =
    createTask.isPending ||
    updateTask.isPending ||
    createRecurring.isPending ||
    updateRecurring.isPending;

  function submit(params: SubmitParams) {
    setErrors({});

    if (params.mode === "create" && params.taskType === "one-time") {
      const formData = new FormData();
      formData.set("title", params.title);
      formData.set("description", params.description);
      formData.set("category", params.category);
      formData.set("scheduledDate", params.scheduledDate);

      createTask.mutate(formData, {
        onSuccess: (result) => {
          if (result.success) {
            params.onSuccess();
          } else if (result.errors) {
            setErrors(result.errors);
          }
        },
      });
      return;
    }

    if (params.mode === "create" && params.taskType === "recurring") {
      const formData = new FormData();
      formData.set("title", params.title);
      formData.set("description", params.description);
      formData.set("category", params.category);
      formData.set("recurrenceType", params.recurrenceType);
      const config = buildRecurrenceConfig(
        params.recurrenceType,
        params.selectedDays,
        params.daysOfMonth,
      );
      if (config) {
        formData.set("recurrenceConfig", config);
      }

      createRecurring.mutate(formData, {
        onSuccess: (result) => {
          if (result.success) {
            params.onSuccess();
          } else if (result.errors) {
            setErrors(result.errors);
          }
        },
      });
      return;
    }

    if (params.mode === "edit" && params.taskType === "one-time") {
      updateTask.mutate(
        {
          taskId: params.taskId!,
          data: {
            title: params.title.trim(),
            description: params.description.trim() || null,
            category: params.category.trim() || null,
            scheduledDate: params.scheduledDate,
          },
        },
        {
          onSuccess: (result) => {
            const res = result as ActionResult | undefined;
            if (res && !res.success && res.errors) {
              setErrors(res.errors);
            } else {
              params.onSuccess();
            }
          },
        },
      );
      return;
    }

    if (params.mode === "edit" && params.taskType === "recurring") {
      const formData = new FormData();
      formData.set("title", params.title);
      formData.set("description", params.description);
      formData.set("category", params.category);
      formData.set("recurrenceType", params.recurrenceType);
      const config = buildRecurrenceConfig(
        params.recurrenceType,
        params.selectedDays,
        params.daysOfMonth,
      );
      if (config) {
        formData.set("recurrenceConfig", config);
      }

      updateRecurring.mutate(
        { taskId: params.taskId!, formData },
        {
          onSuccess: (result: ActionResult) => {
            if (result.success) {
              params.onSuccess();
            } else if (result.errors) {
              setErrors(result.errors);
            }
          },
        },
      );
    }
  }

  return { submit, isPending, errors, setErrors };
}

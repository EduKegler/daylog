export type TaskType = "one-time" | "recurring";
export type RecurrenceTypeValue =
  | "DAILY"
  | "WEEKDAYS"
  | "SPECIFIC_WEEKDAYS"
  | "MONTHLY";

export type OneTimeEditData = {
  title: string;
  description: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  scheduledDate: string;
};

export type RecurringEditData = {
  title: string;
  description: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  recurrenceType: string;
  recurrenceConfig: string | null;
};

export type TaskFormProps =
  | {
      mode: "create";
      defaultTaskType?: TaskType;
      onSuccess: () => void;
      onCancel: () => void;
    }
  | {
      mode: "edit";
      taskType: "one-time";
      taskId: string;
      initialData: OneTimeEditData;
      onSuccess: () => void;
      onCancel: () => void;
    }
  | {
      mode: "edit";
      taskType: "recurring";
      taskId: string;
      initialData: RecurringEditData;
      onSuccess: () => void;
      onCancel: () => void;
    };

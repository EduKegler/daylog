import { inputSmall } from "./input-styles";
import type { TaskType } from "./types";

export function TaskTypeSelector({
  value,
  onChange,
}: {
  value: TaskType;
  onChange: (type: TaskType) => void;
}): React.ReactElement {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskType)}
      className={inputSmall}
    >
      <option value="one-time">One-time</option>
      <option value="recurring">Recurring</option>
    </select>
  );
}

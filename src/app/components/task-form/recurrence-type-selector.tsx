import { inputSmall } from "./input-styles";
import type { RecurrenceTypeValue } from "./types";

export function RecurrenceTypeSelector({
  value,
  onChange,
}: {
  value: RecurrenceTypeValue;
  onChange: (type: RecurrenceTypeValue) => void;
}): React.ReactElement {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RecurrenceTypeValue)}
      className={inputSmall}
    >
      <option value="DAILY">Every day</option>
      <option value="WEEKDAYS">Weekdays</option>
      <option value="SPECIFIC_WEEKDAYS">Specific days</option>
      <option value="MONTHLY">Monthly</option>
    </select>
  );
}

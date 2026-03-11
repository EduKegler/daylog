import { inputSmall } from "./input-styles";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLabel(date: Date, index: number): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const base = `${weekday}, ${month} ${day}`;
  if (index === 0) return `Today — ${base}`;
  if (index === 1) return `Tomorrow — ${base}`;
  return base;
}

function generateOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    options.push({ value: formatDate(date), label: formatLabel(date, i) });
  }
  return options;
}

function normalizeDate(value: string): string {
  return value.slice(0, 10);
}

export function DateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}): React.ReactElement {
  const normalized = normalizeDate(value);
  const options = generateOptions();
  const valueInOptions = options.some((o) => o.value === normalized);

  return (
    <select
      value={normalized}
      onChange={(e) => onChange(e.target.value)}
      className={inputSmall}
    >
      {!valueInOptions && <option value={normalized}>{normalized}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

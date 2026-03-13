import { cn } from "@/lib/cn";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function WeekdayToggles({
  selectedDays,
  onToggle,
}: {
  selectedDays: number[];
  onToggle: (day: number) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1">
      {WEEKDAYS.map((wd) => (
        <button
          key={wd.value}
          type="button"
          onClick={() => onToggle(wd.value)}
          className={cn(
            "px-2.5 py-1.5 text-small rounded-md transition-colors duration-200",
            selectedDays.includes(wd.value)
              ? "bg-accent text-white"
              : "bg-border text-muted hover:bg-stone-300",
          )}
        >
          {wd.label}
        </button>
      ))}
    </div>
  );
}

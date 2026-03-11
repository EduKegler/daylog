import type { DayStats } from "@/lib/stats/day-stats";
import { Text } from "./text";

export function DaySummary({ stats }: { stats: DayStats }) {
  const pct = Math.round(stats.completionRate * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="Completed" value={stats.completed} accent />
      <StatCard label="Pending" value={stats.pending} />
      <div className="bg-white border border-border rounded-xl p-4 flex flex-col items-center justify-center">
        <div className="relative h-14 w-14">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${pct * 1.508} 150.8`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <Text variant="small" className="absolute inset-0 flex items-center justify-center font-semibold">
            {pct}%
          </Text>
        </div>
        <Text variant="caption" className="mt-1.5">
          Progress
        </Text>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col items-center justify-center">
      <Text variant="stat" accent={accent}>
        {value}
      </Text>
      <Text variant="caption" className="mt-1">
        {label}
      </Text>
    </div>
  );
}

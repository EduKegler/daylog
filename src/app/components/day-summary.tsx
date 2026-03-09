"use client";

import type { DayStats } from "@/lib/stats/day-stats";

export function DaySummary({ stats }: { stats: DayStats }) {
  const pct = Math.round(stats.completionRate * 100);

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="Concluídas" value={stats.completed} accent />
      <StatCard label="Pendentes" value={stats.pending} />
      <div className="stat-card flex flex-col items-center justify-center">
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
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
            {pct}%
          </span>
        </div>
        <span className="mt-1.5 text-xs tracking-wide text-[var(--color-muted)] uppercase">
          Progresso
        </span>
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
    <div className="stat-card flex flex-col items-center justify-center">
      <span
        className={`text-3xl font-semibold tabular-nums ${accent ? "text-[var(--color-accent)]" : ""}`}
      >
        {value}
      </span>
      <span className="mt-1 text-xs tracking-wide text-[var(--color-muted)] uppercase">
        {label}
      </span>
    </div>
  );
}

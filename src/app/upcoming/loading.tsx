export default function Loading() {
  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <div className="h-8 w-28 rounded bg-[var(--color-border)] animate-pulse" />
          <div className="h-4 w-32 rounded bg-[var(--color-border)] animate-pulse mt-2" />
        </div>
      </header>

      <div className="dashboard-content">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="upcoming-day-card animate-pulse">
            <div className="upcoming-day-header">
              <div className="h-5 w-28 rounded bg-[var(--color-border)]" />
            </div>
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="task-item">
                <div className="upcoming-dot" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

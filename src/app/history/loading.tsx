export default function Loading() {
  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <div className="h-8 w-20 rounded bg-[var(--color-border)] animate-pulse" />
          <div className="h-4 w-28 rounded bg-[var(--color-border)] animate-pulse mt-2" />
        </div>
      </header>

      <div className="dashboard-content">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="history-day-card animate-pulse">
            <div className="history-day-header">
              <div className="h-5 w-32 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-16 rounded bg-[var(--color-border)]" />
            </div>
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="history-task-item flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-[var(--color-border)]" />
                <div className="h-4 w-2/3 rounded bg-[var(--color-border)]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

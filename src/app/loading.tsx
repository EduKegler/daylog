export default function Loading() {
  return (
    <main className="dashboard">
      <header className="dashboard-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="h-8 w-24 rounded bg-[var(--color-border)] animate-pulse" />
          <div className="h-4 w-40 rounded bg-[var(--color-border)] animate-pulse mt-2" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="stat-card flex flex-col items-center justify-center h-20 animate-pulse"
          >
            <div className="h-8 w-8 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-14 rounded bg-[var(--color-border)] mt-2" />
          </div>
        ))}
      </div>

      <div className="task-section">
        <div className="h-4 w-16 rounded bg-[var(--color-border)] animate-pulse mb-3" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="task-item animate-pulse">
            <div className="checkbox-btn" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

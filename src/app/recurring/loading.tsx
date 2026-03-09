export default function Loading() {
  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <div className="h-8 w-28 rounded bg-[var(--color-border)] animate-pulse" />
          <div className="h-4 w-44 rounded bg-[var(--color-border)] animate-pulse mt-2" />
        </div>
      </header>

      <div className="task-list mt-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="task-item animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
              <div className="h-3 w-1/4 rounded bg-[var(--color-border)]" />
            </div>
            <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
    </main>
  );
}

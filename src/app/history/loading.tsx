export default function Loading() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="h-8 w-20 rounded bg-border animate-pulse" />
          <div className="h-4 w-28 rounded bg-border animate-pulse mt-2" />
        </div>
      </header>

      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mt-8 pb-6 border-b-2 border-border animate-pulse">
            <div className="flex items-baseline justify-between mb-3">
              <div className="h-5 w-32 rounded bg-border" />
              <div className="h-4 w-16 rounded bg-border" />
            </div>
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="py-2 flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-border" />
                <div className="h-4 w-2/3 rounded bg-border" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

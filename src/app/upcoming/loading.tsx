export default function Loading() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="h-8 w-28 rounded bg-border animate-pulse" />
          <div className="h-4 w-32 rounded bg-border animate-pulse mt-2" />
        </div>
      </header>

      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mt-8 pb-6 border-b-2 border-border animate-pulse">
            <div className="flex items-baseline justify-between mb-3">
              <div className="h-5 w-28 rounded bg-border" />
            </div>
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="flex items-start gap-3 py-3.5 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-border shrink-0 mt-[7px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-border" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

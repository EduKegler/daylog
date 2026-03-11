export default function Loading() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="h-8 w-24 rounded bg-border animate-pulse" />
          <div className="h-4 w-40 rounded bg-border animate-pulse mt-2" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="bg-white border border-border rounded-xl p-4 flex flex-col items-center justify-center h-20 animate-pulse"
          >
            <div className="h-8 w-8 rounded bg-border" />
            <div className="h-3 w-14 rounded bg-border mt-2" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="h-4 w-16 rounded bg-border animate-pulse mb-3" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-border shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

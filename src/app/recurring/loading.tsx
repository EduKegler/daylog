export default function Loading() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="h-8 w-28 rounded bg-border animate-pulse" />
          <div className="h-4 w-44 rounded bg-border animate-pulse mt-2" />
        </div>
      </header>

      <div className="flex flex-col mt-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-border" />
              <div className="h-3 w-1/4 rounded bg-border" />
            </div>
            <div className="h-6 w-14 rounded-full bg-border" />
          </div>
        ))}
      </div>
    </main>
  );
}

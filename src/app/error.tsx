"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-stone-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-stone-500 mb-1">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-xs text-stone-400 mb-6 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

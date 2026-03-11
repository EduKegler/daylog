"use client";

import { Text } from "./components/text";

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
        <Text as="h2" variant="heading" className="mb-2">
          Something went wrong
        </Text>
        <Text variant="small" muted className="mb-1">
          {error.message || "An unexpected error occurred."}
        </Text>
        {error.digest && (
          <Text variant="small" muted className="text-xs mb-6 font-mono">
            Digest: {error.digest}
          </Text>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-small font-medium hover:bg-stone-800 transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

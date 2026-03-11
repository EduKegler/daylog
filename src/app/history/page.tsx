import { Suspense } from "react";
import { NavMenu } from "@/app/components/nav-menu";
import { HistoryContent } from "./_components/history-content";

export default function HistoryPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">history</h1>
          <p className="text-subtext text-muted mt-1 block">Previous days</p>
        </div>
        <NavMenu activePath="/history" />
      </header>

      <Suspense>
        <HistoryContent />
      </Suspense>
    </main>
  );
}

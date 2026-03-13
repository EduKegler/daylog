import { Suspense } from "react";
import { NavMenu } from "@/app/components/nav-menu";
import { Text } from "@/app/components/text";
import { HistoryContent } from "./_components/history-content";

export default function HistoryPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <Text variant="display" className="capitalize">history</Text>
          <Text variant="subtext" className="mt-1 block">Previous days</Text>
        </div>
        <NavMenu activePath="/history" />
      </header>

      <Suspense>
        <HistoryContent />
      </Suspense>
    </main>
  );
}

import { NavMenu } from "@/app/components/nav-menu";
import { RecurringContent } from "./_components/recurring-content";

export default function RecurringPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">recurring</h1>
          <p className="text-subtext text-muted mt-1 block">Tasks that repeat automatically</p>
        </div>
        <NavMenu />
      </header>

      <RecurringContent />
    </main>
  );
}

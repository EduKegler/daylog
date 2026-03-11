import { NavMenu } from "@/app/components/nav-menu";
import { UpcomingContent } from "./_components/upcoming-content";

export default function UpcomingPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">upcoming</h1>
          <p className="text-subtext text-muted mt-1 block">Scheduled tasks</p>
        </div>
        <NavMenu />
      </header>

      <UpcomingContent />
    </main>
  );
}

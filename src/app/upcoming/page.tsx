import { NavMenu } from "@/app/components/nav-menu";
import { Text } from "@/app/components/text";
import { UpcomingContent } from "./_components/upcoming-content";

export default function UpcomingPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <Text variant="display" className="capitalize">upcoming</Text>
          <Text variant="subtext" className="mt-1 block">Scheduled tasks</Text>
        </div>
        <NavMenu activePath="/upcoming" />
      </header>

      <UpcomingContent />
    </main>
  );
}

import { NavMenu } from "@/app/components/nav-menu";
import { Text } from "@/app/components/text";
import { RecurringContent } from "./_components/recurring-content";

export default function RecurringPage() {
  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <Text variant="display" className="capitalize">recurring</Text>
          <Text variant="subtext" className="mt-1 block">Tasks that repeat automatically</Text>
        </div>
        <NavMenu activePath="/recurring" />
      </header>

      <RecurringContent />
    </main>
  );
}

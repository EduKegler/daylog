import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getUpcomingTasks } from "@/lib/upcoming/queries";
import { NavMenu } from "@/app/components/nav-menu";
import { EmptyState } from "@/app/components/empty-state";
import { NoUpcomingIllustration } from "@/app/components/empty-state-illustrations";
import { UpcomingDayCard } from "./_components/upcoming-day-card";

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);
  const days = await getUpcomingTasks(user.id, today);

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-display text-stone-900 leading-none capitalize">upcoming</h1>
          <p className="text-subtext text-muted mt-1 block">Scheduled tasks</p>
        </div>
        <NavMenu />
      </header>

      <div>
        {days.length === 0 ? (
          <EmptyState
            illustration={<NoUpcomingIllustration />}
            title="No upcoming tasks"
            description="Tasks scheduled for future days will show up here."
          />
        ) : (
          days.map((day) => (
            <UpcomingDayCard
              key={day.date.toISOString()}
              day={day}
              today={today}
            />
          ))
        )}
      </div>
    </main>
  );
}

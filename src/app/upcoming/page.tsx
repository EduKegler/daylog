import { getCurrentUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { getUpcomingTasks } from "@/lib/upcoming/queries";
import { NavMenu } from "@/app/components/nav-menu";
import { UpcomingDayCard } from "./_components/upcoming-day-card";

export default async function UpcomingPage() {
  const user = await getCurrentUser();
  const today = getUserLocalDate(user.timezone);
  const days = await getUpcomingTasks(user.id, today);

  return (
    <main className="dashboard">
      <header className="dashboard-header flex items-start justify-between">
        <div>
          <h1 className="app-title">upcoming</h1>
          <p className="today-date">Scheduled tasks</p>
        </div>
        <NavMenu />
      </header>

      <div className="dashboard-content">
        {days.length === 0 ? (
          <p className="empty-message">No upcoming tasks scheduled.</p>
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

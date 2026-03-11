import { cookies } from "next/headers";
import { DaylogIcon } from "./components/daylog-icon";
import { Text } from "./components/text";
import { getOptionalUser } from "@/lib/auth/session";
import { getUserLocalDate } from "@/lib/tasks/generation";
import { formatLongDate } from "@/lib/dates/format";
import { GUEST_TIMEZONE_COOKIE, DEFAULT_TIMEZONE } from "@/lib/guest/constants";
import { NavMenu } from "./components/nav-menu";
import { DashboardContent } from "./components/dashboard-content";

export default async function DashboardPage() {
  const user = await getOptionalUser();
  let timezone = DEFAULT_TIMEZONE;
  if (user) {
    timezone = user.timezone;
  } else {
    const cookieStore = await cookies();
    timezone = cookieStore.get(GUEST_TIMEZONE_COOKIE)?.value ?? DEFAULT_TIMEZONE;
  }
  const today = getUserLocalDate(timezone);

  return (
    <main className="max-w-[42rem] mx-auto py-8 px-6">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <DaylogIcon size={28} />
            <Text variant="display" className="capitalize">daylog</Text>
          </div>
          <time className="text-subtext text-muted mt-1 block" dateTime={today.toISOString()}>
            {formatLongDate(today)}
          </time>
        </div>
        <NavMenu activePath="/" />
      </header>

      <DashboardContent />
    </main>
  );
}

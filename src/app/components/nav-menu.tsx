import Link from "next/link";
import { signOut } from "@/lib/auth";

export function NavMenu({ showHome = true }: { showHome?: boolean }) {
  return (
    <nav className="flex items-baseline gap-3 sm:gap-4">
      {showHome && (
        <Link href="/" className="nav-link">
          Home
        </Link>
      )}
      <Link href="/history" className="nav-link">
        History
      </Link>
      <Link href="/upcoming" className="nav-link">
        Upcoming
      </Link>
      <Link href="/recurring" className="nav-link">
        Recurring
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="text-small text-[var(--color-muted)] hover:text-stone-600 transition-colors duration-200"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}

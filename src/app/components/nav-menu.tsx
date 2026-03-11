import Link from "next/link";
import { signOut } from "@/lib/auth";

const link = "text-small text-muted transition-colors duration-200 hover:text-accent";

export function NavMenu({ showHome = true }: { showHome?: boolean }) {
  return (
    <nav className="flex items-baseline gap-3 sm:gap-4">
      {showHome && (
        <Link href="/" className={link}>
          Home
        </Link>
      )}
      <Link href="/history" className={link}>
        History
      </Link>
      <Link href="/upcoming" className={link}>
        Upcoming
      </Link>
      <Link href="/recurring" className={link}>
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
          className="text-small text-muted hover:text-stone-600 transition-colors duration-200"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}

import Link from "next/link";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth/session";
import { UserAvatar } from "./user-avatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/recurring", label: "Recurring" },
] as const;

type ActivePath = (typeof navLinks)[number]["href"] | "/profile";

export async function NavMenu({
  activePath,
}: {
  activePath?: ActivePath;
}) {
  const user = await getCurrentUser();

  return (
    <nav className="flex items-center gap-3 sm:gap-4">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-small transition-colors duration-200",
            activePath === link.href
              ? "text-stone-900"
              : "text-muted hover:text-accent",
          )}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/profile"
        aria-label="Profile"
        className="transition-opacity duration-200 hover:opacity-80"
      >
        <UserAvatar name={user.name} image={user.image} />
      </Link>
    </nav>
  );
}

import { cn } from "@/lib/cn";

type UserAvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: number;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const base = "rounded-full overflow-hidden flex items-center justify-center shrink-0";

export function UserAvatar({ name, image, size = 24 }: UserAvatarProps) {
  const style = { width: size, height: size };

  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User avatar"}
        referrerPolicy="no-referrer"
        className={cn(base, "object-cover")}
        style={style}
      />
    );
  }

  if (name) {
    const initials = getInitials(name);
    const fontSize = size * 0.4;
    return (
      <span
        className={cn(base, "bg-border text-muted font-medium")}
        style={{ ...style, fontSize }}
      >
        {initials}
      </span>
    );
  }

  return (
    <span className={cn(base, "bg-border text-muted")} style={style}>
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    </span>
  );
}

import { cn } from "@/lib/cn";

export function CharCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "text-xs text-muted ml-auto",
        current > max && "text-red-600",
      )}
    >
      {current}/{max}
    </span>
  );
}

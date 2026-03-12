import { TAG_COLORS } from "@/lib/tags/colors";
import type { TagColorKey } from "@/lib/tags/colors";

type TagBadgeProps = {
  name: string;
  color: string;
  onRemove?: () => void;
};

export function TagBadge({ name, color, onRemove }: TagBadgeProps): React.ReactElement {
  const palette = TAG_COLORS[color as TagColorKey] ?? TAG_COLORS.stone;

  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1"
      style={{ background: palette.bg, color: palette.text }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center bg-transparent border-none p-0 cursor-pointer"
          style={{ color: palette.text }}
          aria-label={`Remove tag ${name}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-60 hover:opacity-100 transition-opacity duration-200"
          >
            <path d="M4 4l6 6M10 4l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}

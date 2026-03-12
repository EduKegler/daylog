export type TagColorKey =
  | "rose"
  | "orange"
  | "amber"
  | "lime"
  | "emerald"
  | "sky"
  | "blue"
  | "violet"
  | "pink"
  | "stone";

type TagColor = {
  bg: string;
  text: string;
};

export const TAG_COLORS: Record<TagColorKey, TagColor> = {
  rose: { bg: "#FECDD3", text: "#9F1239" },
  orange: { bg: "#FED7AA", text: "#9A3412" },
  amber: { bg: "#FDE68A", text: "#854D0E" },
  lime: { bg: "#D9F99D", text: "#3F6212" },
  emerald: { bg: "#A7F3D0", text: "#065F46" },
  sky: { bg: "#BAE6FD", text: "#075985" },
  blue: { bg: "#BFDBFE", text: "#1E40AF" },
  violet: { bg: "#E9D5FF", text: "#6B21A8" },
  pink: { bg: "#FBCFE8", text: "#9D174D" },
  stone: { bg: "#E7E5E4", text: "#44403C" },
};

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS) as TagColorKey[];

export function isValidTagColor(color: string): color is TagColorKey {
  return color in TAG_COLORS;
}

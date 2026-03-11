type TextVariant =
  | "display"
  | "heading"
  | "body"
  | "subtext"
  | "small"
  | "label"
  | "caption"
  | "stat";

type TextProps = {
  variant?: TextVariant;
  as?: React.ElementType;
  muted?: boolean;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const variantConfig: Record<
  TextVariant,
  { classes: string; defaultAs: React.ElementType; defaultMuted: boolean }
> = {
  display: {
    classes: "font-display text-display leading-none",
    defaultAs: "h1",
    defaultMuted: false,
  },
  heading: {
    classes: "font-display text-heading",
    defaultAs: "h2",
    defaultMuted: false,
  },
  body: { classes: "text-body", defaultAs: "p", defaultMuted: false },
  subtext: { classes: "text-subtext", defaultAs: "p", defaultMuted: true },
  small: { classes: "text-small", defaultAs: "span", defaultMuted: false },
  label: {
    classes: "text-small font-medium uppercase tracking-wider",
    defaultAs: "span",
    defaultMuted: true,
  },
  caption: {
    classes: "text-small uppercase tracking-wide",
    defaultAs: "span",
    defaultMuted: true,
  },
  stat: {
    classes: "text-stat font-semibold tabular-nums",
    defaultAs: "span",
    defaultMuted: false,
  },
};

export function Text({
  variant = "body",
  as,
  muted,
  accent,
  className,
  children,
  ...rest
}: TextProps) {
  const config = variantConfig[variant];
  const Component = as ?? config.defaultAs;
  const isMuted = muted ?? config.defaultMuted;

  const colorClass = accent
    ? "text-[var(--color-accent)]"
    : isMuted
      ? "text-[var(--color-muted)]"
      : "";

  return (
    <Component
      className={[config.classes, colorClass, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}

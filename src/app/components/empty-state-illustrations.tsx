const shared = {
  width: 64,
  height: 64,
  viewBox: "0 0 64 64",
  fill: "none",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AllClearIllustration() {
  return (
    <svg {...shared}>
      {/* Circle */}
      <circle cx="32" cy="32" r="20" stroke="currentColor" />
      {/* Checkmark in accent */}
      <path
        d="M22 32L29 39L42 26"
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Shine lines */}
      <path d="M32 8V4" stroke="currentColor" />
      <path d="M32 60V56" stroke="currentColor" />
      <path d="M8 32H4" stroke="currentColor" />
      <path d="M60 32H56" stroke="currentColor" />
    </svg>
  );
}

export function NoCompletedIllustration() {
  return (
    <svg {...shared}>
      {/* Checkbox 1 */}
      <rect x="17" y="20" width="14" height="14" rx="3" stroke="currentColor" />
      {/* Accent dash inside checkbox 1 */}
      <path d="M21 27H27" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
      {/* Line 1 */}
      <path d="M37 27H50" stroke="currentColor" />
      {/* Checkbox 2 */}
      <rect x="17" y="38" width="14" height="14" rx="3" stroke="currentColor" />
      {/* Line 2 */}
      <path d="M37 45H46" stroke="currentColor" />
    </svg>
  );
}

export function NoUpcomingIllustration() {
  return (
    <svg {...shared}>
      {/* Calendar body */}
      <rect x="12" y="16" width="40" height="36" rx="3" stroke="currentColor" />
      {/* Header line */}
      <path d="M12 26H52" stroke="currentColor" />
      {/* Hangers */}
      <path d="M24 12V20" stroke="var(--color-accent)" />
      <path d="M40 12V20" stroke="var(--color-accent)" />
      {/* Day dots */}
      <circle cx="22" cy="34" r="1.5" fill="var(--color-accent)" />
      <circle cx="32" cy="34" r="1.5" fill="var(--color-accent)" />
      <circle cx="42" cy="34" r="1.5" fill="var(--color-accent)" />
      <circle cx="22" cy="44" r="1.5" fill="var(--color-accent)" />
    </svg>
  );
}

export function NoHistoryIllustration() {
  return (
    <svg {...shared}>
      {/* Clock face */}
      <circle cx="32" cy="32" r="20" stroke="currentColor" />
      {/* Tick marks at 12, 3, 6, 9 */}
      <path d="M32 14V18" stroke="currentColor" />
      <path d="M50 32H46" stroke="currentColor" />
      <path d="M32 50V46" stroke="currentColor" />
      <path d="M14 32H18" stroke="currentColor" />
      {/* Single hand pointing to ~2 o'clock (accent) */}
      <path d="M32 32L40 22" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="32" cy="32" r="2" fill="var(--color-accent)" />
    </svg>
  );
}

export function NoRecurringIllustration() {
  return (
    <svg {...shared}>
      {/* Arc from 3 o'clock clockwise almost full circle, curving into arrowhead */}
      <path d="M50 32a18 18 0 1 1-18-18c5 0 9.86 2 13.48 5.48L50 24" stroke="currentColor" />
      {/* L-shaped arrowhead at upper-right (accent) */}
      <path d="M50 14v10h-10" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

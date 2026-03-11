import { GUEST_QUOTAS } from "./constants";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 24 * 60 * 60 * 1000;

const dailyTaskLimits = new Map<string, RateLimitEntry>();
const recurringTaskLimits = new Map<string, RateLimitEntry>();

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  max: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count++;
  return true;
}

export function checkGuestDailyTaskLimit(guestSessionId: string): boolean {
  return checkLimit(
    dailyTaskLimits,
    guestSessionId,
    GUEST_QUOTAS.dailyTasksPerDay,
  );
}

export function checkGuestRecurringTaskLimit(guestSessionId: string): boolean {
  return checkLimit(
    recurringTaskLimits,
    guestSessionId,
    GUEST_QUOTAS.recurringTasksTotal,
  );
}

/** Visible for testing */
export function _resetLimits(): void {
  dailyTaskLimits.clear();
  recurringTaskLimits.clear();
}

import { cookies } from "next/headers";
import { getOptionalUser } from "./session";
import { GUEST_SESSION_COOKIE } from "@/lib/guest/constants";
import { getGuestSession, createGuestSession, deleteGuestCookie, getGuestTimezoneCookie } from "@/lib/guest/session";
import { claimGuestData } from "@/lib/guest/claim";

export type OwnerContext =
  | { type: "user"; userId: string; timezone: string }
  | { type: "guest"; guestSessionId: string; timezone: string };

export type OwnerFilter =
  | { userId: string; guestSessionId?: undefined }
  | { guestSessionId: string; userId?: undefined };

export function buildOwnerFilter(ctx: OwnerContext): OwnerFilter {
  if (ctx.type === "user") {
    return { userId: ctx.userId };
  }
  return { guestSessionId: ctx.guestSessionId };
}

/**
 * Resolves the current owner context for read operations.
 * If user is authenticated and has a guest cookie, claims guest data first.
 * Returns null if no valid session exists (API should return empty data).
 */
export async function resolveOwnerContext(): Promise<OwnerContext | null> {
  const user = await getOptionalUser();
  const cookieStore = await cookies();
  const guestCookieValue = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  // Authenticated user
  if (user) {
    // Claim guest data if guest cookie exists
    if (guestCookieValue) {
      try {
        await claimGuestData(guestCookieValue, user.id);
      } catch {
        // Guest session may already be claimed or expired — ignore
      }
      await deleteGuestCookie();
    }

    return { type: "user", userId: user.id, timezone: user.timezone };
  }

  // Guest with existing session
  if (guestCookieValue) {
    const session = await getGuestSession(guestCookieValue);
    if (session) {
      return {
        type: "guest",
        guestSessionId: session.id,
        timezone: session.timezone,
      };
    }
    // Expired or invalid — clean up
    await deleteGuestCookie();
  }

  return null;
}

/**
 * Resolves the current owner context for write operations.
 * Creates a guest session if no session exists.
 * Always returns a valid context.
 */
export async function resolveWriteContext(): Promise<OwnerContext> {
  const ctx = await resolveOwnerContext();
  if (ctx) return ctx;

  // Create a new guest session
  const timezone = await getGuestTimezoneCookie();
  const session = await createGuestSession(timezone);

  return {
    type: "guest",
    guestSessionId: session.id,
    timezone: session.timezone,
  };
}

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  GUEST_SESSION_COOKIE,
  GUEST_TIMEZONE_COOKIE,
  GUEST_SESSION_TTL_DAYS,
  DEFAULT_TIMEZONE,
} from "./constants";

export async function createGuestSession(
  timezone: string,
): Promise<{ id: string; timezone: string; lastProcessedDate: Date | null }> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS);

  const session = await prisma.guestSession.create({
    data: { timezone, expiresAt },
    select: { id: true, timezone: true, lastProcessedDate: true },
  });

  await setGuestCookie(session.id);
  return session;
}

export async function getGuestSession(
  guestSessionId: string,
): Promise<{
  id: string;
  timezone: string;
  lastProcessedDate: Date | null;
} | null> {
  const session = await prisma.guestSession.findUnique({
    where: { id: guestSessionId },
    select: { id: true, timezone: true, lastProcessedDate: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function setGuestCookie(guestSessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SESSION_COOKIE, guestSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function deleteGuestCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_SESSION_COOKIE);
}

export async function getGuestTimezoneCookie(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_TIMEZONE_COOKIE)?.value ?? DEFAULT_TIMEZONE;
}

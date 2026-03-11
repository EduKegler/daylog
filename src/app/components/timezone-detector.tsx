"use client";

import { useEffect } from "react";
import { GUEST_TIMEZONE_COOKIE, GUEST_SESSION_TTL_DAYS } from "@/lib/guest/constants";

export function TimezoneDetector() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `${GUEST_TIMEZONE_COOKIE}=${timezone};path=/;max-age=${GUEST_SESSION_TTL_DAYS * 24 * 60 * 60};samesite=lax`;
  }, []);

  return null;
}

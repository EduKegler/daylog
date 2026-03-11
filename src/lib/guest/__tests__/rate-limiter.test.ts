import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkGuestDailyTaskLimit,
  checkGuestRecurringTaskLimit,
  _resetLimits,
} from "../rate-limiter";
import { GUEST_QUOTAS } from "../constants";

describe("rate-limiter", () => {
  beforeEach(() => {
    _resetLimits();
    vi.restoreAllMocks();
  });

  describe("checkGuestDailyTaskLimit", () => {
    it("allows up to quota limit", () => {
      for (let i = 0; i < GUEST_QUOTAS.dailyTasksPerDay; i++) {
        expect(checkGuestDailyTaskLimit("guest-1")).toBe(true);
      }
    });

    it("blocks after exceeding quota", () => {
      for (let i = 0; i < GUEST_QUOTAS.dailyTasksPerDay; i++) {
        checkGuestDailyTaskLimit("guest-1");
      }
      expect(checkGuestDailyTaskLimit("guest-1")).toBe(false);
    });

    it("tracks guests independently", () => {
      for (let i = 0; i < GUEST_QUOTAS.dailyTasksPerDay; i++) {
        checkGuestDailyTaskLimit("guest-1");
      }
      expect(checkGuestDailyTaskLimit("guest-1")).toBe(false);
      expect(checkGuestDailyTaskLimit("guest-2")).toBe(true);
    });

    it("resets after 24h window", () => {
      for (let i = 0; i < GUEST_QUOTAS.dailyTasksPerDay; i++) {
        checkGuestDailyTaskLimit("guest-1");
      }
      expect(checkGuestDailyTaskLimit("guest-1")).toBe(false);

      vi.spyOn(Date, "now").mockReturnValue(
        Date.now() + 24 * 60 * 60 * 1000 + 1,
      );
      expect(checkGuestDailyTaskLimit("guest-1")).toBe(true);
    });
  });

  describe("checkGuestRecurringTaskLimit", () => {
    it("allows up to quota limit", () => {
      for (let i = 0; i < GUEST_QUOTAS.recurringTasksTotal; i++) {
        expect(checkGuestRecurringTaskLimit("guest-1")).toBe(true);
      }
    });

    it("blocks after exceeding quota", () => {
      for (let i = 0; i < GUEST_QUOTAS.recurringTasksTotal; i++) {
        checkGuestRecurringTaskLimit("guest-1");
      }
      expect(checkGuestRecurringTaskLimit("guest-1")).toBe(false);
    });
  });
});

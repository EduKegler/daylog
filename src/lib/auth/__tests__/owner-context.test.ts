import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockGetOptionalUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: mockGetOptionalUser,
}));

const mockGetGuestSession = vi.hoisted(() => vi.fn());
const mockCreateGuestSession = vi.hoisted(() => vi.fn());
const mockDeleteGuestCookie = vi.hoisted(() => vi.fn());
const mockGetGuestTimezoneCookie = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guest/session", () => ({
  getGuestSession: mockGetGuestSession,
  createGuestSession: mockCreateGuestSession,
  deleteGuestCookie: mockDeleteGuestCookie,
  getGuestTimezoneCookie: mockGetGuestTimezoneCookie,
}));

const mockClaimGuestData = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guest/claim", () => ({
  claimGuestData: mockClaimGuestData,
}));

import {
  buildOwnerFilter,
  resolveOwnerContext,
  resolveWriteContext,
} from "../owner-context";

describe("buildOwnerFilter", () => {
  it("returns userId filter for user context", () => {
    const result = buildOwnerFilter({
      type: "user",
      userId: "user-1",
      timezone: "UTC",
    });
    expect(result).toEqual({ userId: "user-1" });
  });

  it("returns guestSessionId filter for guest context", () => {
    const result = buildOwnerFilter({
      type: "guest",
      guestSessionId: "guest-1",
      timezone: "UTC",
    });
    expect(result).toEqual({ guestSessionId: "guest-1" });
  });
});

describe("resolveOwnerContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user context when authenticated without guest cookie", async () => {
    mockGetOptionalUser.mockResolvedValue({
      id: "user-1",
      timezone: "America/Sao_Paulo",
    });
    mockCookieStore.get.mockReturnValue(undefined);

    const ctx = await resolveOwnerContext();

    expect(ctx).toEqual({
      type: "user",
      userId: "user-1",
      timezone: "America/Sao_Paulo",
    });
    expect(mockClaimGuestData).not.toHaveBeenCalled();
  });

  it("claims guest data when user has guest cookie", async () => {
    mockGetOptionalUser.mockResolvedValue({
      id: "user-1",
      timezone: "America/Sao_Paulo",
    });
    mockCookieStore.get.mockReturnValue({ value: "guest-1" });
    mockClaimGuestData.mockResolvedValue({
      claimedDailyTasks: 2,
      claimedRecurringTasks: 1,
    });
    mockDeleteGuestCookie.mockResolvedValue(undefined);

    const ctx = await resolveOwnerContext();

    expect(ctx).toEqual({
      type: "user",
      userId: "user-1",
      timezone: "America/Sao_Paulo",
    });
    expect(mockClaimGuestData).toHaveBeenCalledWith("guest-1", "user-1");
    expect(mockDeleteGuestCookie).toHaveBeenCalled();
  });

  it("ignores claim errors gracefully", async () => {
    mockGetOptionalUser.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
    });
    mockCookieStore.get.mockReturnValue({ value: "expired-guest" });
    mockClaimGuestData.mockRejectedValue(new Error("Not found"));
    mockDeleteGuestCookie.mockResolvedValue(undefined);

    const ctx = await resolveOwnerContext();

    expect(ctx).toEqual({ type: "user", userId: "user-1", timezone: "UTC" });
    expect(mockDeleteGuestCookie).toHaveBeenCalled();
  });

  it("returns guest context for valid guest session", async () => {
    mockGetOptionalUser.mockResolvedValue(null);
    mockCookieStore.get.mockReturnValue({ value: "guest-1" });
    mockGetGuestSession.mockResolvedValue({
      id: "guest-1",
      timezone: "Europe/London",
      lastProcessedDate: null,
    });

    const ctx = await resolveOwnerContext();

    expect(ctx).toEqual({
      type: "guest",
      guestSessionId: "guest-1",
      timezone: "Europe/London",
    });
  });

  it("returns null and cleans up expired guest session", async () => {
    mockGetOptionalUser.mockResolvedValue(null);
    mockCookieStore.get.mockReturnValue({ value: "expired-guest" });
    mockGetGuestSession.mockResolvedValue(null);
    mockDeleteGuestCookie.mockResolvedValue(undefined);

    const ctx = await resolveOwnerContext();

    expect(ctx).toBeNull();
    expect(mockDeleteGuestCookie).toHaveBeenCalled();
  });

  it("returns null when no session exists", async () => {
    mockGetOptionalUser.mockResolvedValue(null);
    mockCookieStore.get.mockReturnValue(undefined);

    const ctx = await resolveOwnerContext();

    expect(ctx).toBeNull();
  });
});

describe("resolveWriteContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns existing context when available", async () => {
    mockGetOptionalUser.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
    });
    mockCookieStore.get.mockReturnValue(undefined);

    const ctx = await resolveWriteContext();

    expect(ctx).toEqual({ type: "user", userId: "user-1", timezone: "UTC" });
    expect(mockCreateGuestSession).not.toHaveBeenCalled();
  });

  it("creates guest session when no session exists", async () => {
    mockGetOptionalUser.mockResolvedValue(null);
    mockCookieStore.get.mockReturnValue(undefined);
    mockGetGuestTimezoneCookie.mockResolvedValue("Asia/Tokyo");
    mockCreateGuestSession.mockResolvedValue({
      id: "new-guest",
      timezone: "Asia/Tokyo",
      lastProcessedDate: null,
    });

    const ctx = await resolveWriteContext();

    expect(ctx).toEqual({
      type: "guest",
      guestSessionId: "new-guest",
      timezone: "Asia/Tokyo",
    });
    expect(mockCreateGuestSession).toHaveBeenCalledWith("Asia/Tokyo");
  });
});

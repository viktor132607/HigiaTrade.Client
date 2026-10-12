import { describe, expect, it } from "vitest";
import {
  ADMIN_NOTICE_COOLDOWN_MS,
  noticeKeyForAdmin,
  shouldDisplayAdminNotice,
} from "../adminNoticeCooldown";

describe("invoice incomplete admin notice cooldown", () => {
  const now = new Date("2026-10-12T19:00:00Z").getTime();

  it("displays the notice on first visit and with missing or corrupt timestamps", () => {
    expect(shouldDisplayAdminNotice(null, now)).toBe(true);
    expect(shouldDisplayAdminNotice("invalid", now)).toBe(true);
    expect(shouldDisplayAdminNotice("0", now)).toBe(true);
  });

  it("does not display again on a new visit before a full hour passes", () => {
    expect(shouldDisplayAdminNotice(String(now), now)).toBe(false);
    expect(shouldDisplayAdminNotice(String(now), now + ADMIN_NOTICE_COOLDOWN_MS - 1)).toBe(false);
    expect(shouldDisplayAdminNotice(String(now), now + ADMIN_NOTICE_COOLDOWN_MS)).toBe(true);
    expect(shouldDisplayAdminNotice(String(now), now + 2 * ADMIN_NOTICE_COOLDOWN_MS)).toBe(true);
  });

  it("does not mix up timestamps for different admin accounts", () => {
    expect(noticeKeyForAdmin("first")).not.toBe(noticeKeyForAdmin("second"));
  });
});

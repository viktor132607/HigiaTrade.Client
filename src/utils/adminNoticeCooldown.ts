export const ADMIN_NOTICE_COOLDOWN_MS = 60 * 60 * 1000;
const ADMIN_NOTICE_STORAGE_PREFIX = "hygiaTrade:invoiceIncompleteNotice:lastSeen";

export const noticeKeyForAdmin = (adminId: string): string =>
  `${ADMIN_NOTICE_STORAGE_PREFIX}:${adminId}`;

// Invalid or missing timestamps must not permanently hide an important notice.
export const shouldDisplayAdminNotice = (
  lastSeen: string | null,
  now: number,
): boolean => {
  if (lastSeen === null) return true;
  const timestamp = Number(lastSeen);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return true;
  return now - timestamp >= ADMIN_NOTICE_COOLDOWN_MS;
};

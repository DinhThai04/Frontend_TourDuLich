/** Backend caps `/all` list endpoints at this many rows per request. */
export const LIST_PAGE_SIZE = 500;

export interface ListQuery {
  page?: number;
  size?: number;
  /** Keep the list on the caller's own rows even when the account is allowed to read everyone's. */
  mine?: boolean;
}

/** Default to the first, largest supported page so admin tables see as much data as allowed. */
export const listPageParams = (query?: ListQuery): Required<Omit<ListQuery, 'mine'>> & Pick<ListQuery, 'mine'> => ({
  page: query?.page ?? 0,
  size: query?.size ?? LIST_PAGE_SIZE,
  ...(query?.mine ? { mine: true } : {}),
});

/** A full page means the backend may hold more rows than the caller received. */
export const isListCapped = (rows?: readonly unknown[] | null, cap: number = LIST_PAGE_SIZE): boolean =>
  (rows?.length ?? 0) >= cap;

/** `/tour/tours/list` stops at TourService.MAX_CATALOGUE_SIZE rows. */
export const TOUR_LIST_CAP = 200;

/**
 * crypto.randomUUID is missing outside secure contexts (plain-HTTP LAN), but the backend validates
 * the key with UUID.fromString, so the fallback must still produce a canonical v4 string.
 */
export const createClientKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const formatCurrencyVND = (amount: number): string => {
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

/**
 * Backend timestamps are Vietnam wall-clock without an offset ("2026-11-05T08:00:00").
 * Parsing them as browser-local shifts every time for users outside UTC+7, so pin both
 * parsing and display to Asia/Ho_Chi_Minh.
 */
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET = "+07:00";
const NAIVE_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const toVietnamDate = (value: string): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const normalized = DATE_ONLY.test(trimmed)
    ? `${trimmed}T00:00:00${VIETNAM_OFFSET}`
    : NAIVE_DATE_TIME.test(trimmed)
      ? `${trimmed}${VIETNAM_OFFSET}`
      : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDatetime = (datetimeStr: string): string => {
  const date = toVietnamDate(datetimeStr);
  if (!date) return "—";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: VIETNAM_TIME_ZONE,
  });
};

export const formatDate = (dateStr: string): string => {
  const date = toVietnamDate(dateStr);
  if (!date) return "—";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: VIETNAM_TIME_ZONE,
  });
};

export const parseDate = (dateStr: string): Date | null => toVietnamDate(dateStr);
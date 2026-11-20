import type { Dayjs } from 'dayjs';
import type { PassengerType } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';

export const PASSENGER_LABELS: Record<PassengerType, string> = {
  ADULT: 'Người lớn',
  CHILD: 'Trẻ em',
  TODDLER: 'Trẻ nhỏ',
  INFANT: 'Em bé',
};

export const PARTY_TYPES = ['ADULT', 'CHILD', 'TODDLER', 'INFANT'] as const;
export type PartyCounts = Record<PassengerType, number>;
export const DEFAULT_PARTY: PartyCounts = { ADULT: 1, CHILD: 0, TODDLER: 0, INFANT: 0 };

export function parseParty(value: string | null): PartyCounts | undefined {
  if (!value || !/^\d{1,2}(,\d{1,2}){3}$/.test(value)) return;
  const [ADULT = 0, CHILD = 0, TODDLER = 0, INFANT = 0] = value.split(',').map(Number);
  const party = { ADULT, CHILD, TODDLER, INFANT };
  const size = countParty(party);
  return size >= 1 && size <= 40 ? party : undefined;
}

export function countParty(party: PartyCounts) {
  return PARTY_TYPES.reduce((total, type) => total + party[type], 0);
}

export function formatParty(party: PartyCounts) {
  return PARTY_TYPES.map(type => party[type]).join(',');
}

export function quoteParty(party: PartyCounts, price: ITourPrice) {
  return PARTY_TYPES.filter(type => party[type] > 0).map(type => {
    const unitAmount = unitPriceFor(type, price);
    return { label: PASSENGER_LABELS[type], quantity: party[type], unitAmount, amount: unitAmount * party[type] };
  });
}

export function readPartyDraft(scope: string) {
  try {
    const [party, includeBooker] = (sessionStorage.getItem(`${scope}:party`) ?? '').split(';');
    const counts = parseParty(party ?? null);
    if (counts && (includeBooker === '0' || includeBooker === '1')) {
      return { counts, includeBooker: includeBooker === '1' && counts.ADULT > 0 };
    }
  } catch {
    return undefined;
  }
}

export function savePartyDraft(scope: string, counts: PartyCounts, includeBooker: boolean) {
  try {
    const party = formatParty(counts);
    if (parseParty(party)) sessionStorage.setItem(`${scope}:party`, `${party};${includeBooker ? '1' : '0'}`);
    else sessionStorage.removeItem(`${scope}:party`);
  } catch {
    return;
  }
}

/** Nhãn hiển thị cho loại khách; dữ liệu cũ có thể thiếu nên trả về dấu gạch thay vì mã thô. */
export function passengerLabel(type?: string | null): string {
  return (type && PASSENGER_LABELS[type as PassengerType]) || '—';
}

/** Đơn giá theo loại hành khách, lấy từ bảng giá của chuyến đi. */
export function unitPriceFor(type: PassengerType, price?: ITourPrice | null): number {
  if (!price) return 0;
  switch (type) {
    case 'CHILD':
      return Number(price.childPrice ?? 0);
    case 'TODDLER':
      return Number(price.toddlerPrice ?? 0);
    case 'INFANT':
      return Number(price.infantPrice ?? 0);
    default:
      return Number(price.adultPrice ?? 0);
  }
}

const supplementCurrency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function tourPriceNote(supplement?: number | string | null) {
  const amount = supplement == null ? undefined : Number(supplement);
  const fee = amount != null && Number.isFinite(amount)
    ? `Phụ thu phòng đơn tham khảo: ${supplementCurrency.format(amount)}. `
    : '';
  return `${fee}Tổng tiền tính theo nhóm khách. Các dịch vụ ngoài chương trình và phụ thu phòng đơn được xác nhận riêng.`;
}

const vietnamDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function bookingDateParts(now: Date) {
  const parts = Object.fromEntries(vietnamDate.formatToParts(now).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export function vietnamBookingDay(now = new Date()) {
  const { year, month, day } = bookingDateParts(now);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Booking prices use the date in Vietnam. A birth date is a calendar date, not an instant. */
export function ageOnVietnamDate(birthDate: Dayjs | null | undefined, now = new Date()): number | null {
  if (!birthDate?.isValid()) return null;
  const { year, month, day } = bookingDateParts(now);
  let age = year - birthDate.year();
  const monthDiff = month - 1 - birthDate.month();
  if (monthDiff < 0 || (monthDiff === 0 && day < birthDate.date())) age -= 1;
  return age;
}

export function passengerTypeFor(birthDate: Dayjs | null | undefined, now?: Date, fallback: PassengerType = 'ADULT'): PassengerType {
  const age = ageOnVietnamDate(birthDate, now);
  if (age === null || age < 0) return fallback;
  if (age < 2) return 'INFANT';
  if (age <= 4) return 'TODDLER';
  return age <= 11 ? 'CHILD' : 'ADULT';
}

export function passengersForBooking<T>(includeBooker: boolean, booker: T, extras: T[]): T[] {
  return [...(includeBooker ? [booker] : []), ...extras];
}
export function bookingHistoryLink(bookingId?: number | null) {
  return `/profile${bookingId ? `?bookingId=${bookingId}` : ''}#don-dat-tour`;
}

import type { Dayjs } from 'dayjs';
import type { PassengerType } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';

export const PASSENGER_LABELS: Record<PassengerType, string> = {
  ADULT: 'Người lớn',
  CHILD: 'Trẻ em',
  TODDLER: 'Trẻ nhỏ',
  INFANT: 'Em bé',
};

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

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

/**
 * Cùng quy tắc tuổi với booking_service (dưới 2, 2-4, 5-11, từ 12 tuổi).
 * Giữ giá xem trước khớp với giá server sẽ tính khi thanh toán.
 */
export function passengerTypeFor(birthDate: Dayjs | null | undefined): PassengerType {
  if (!birthDate?.isValid()) return 'ADULT';
  const today = new Date();
  let age = today.getFullYear() - birthDate.year();
  const monthDiff = today.getMonth() - birthDate.month();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.date())) age -= 1;
  if (age < 2) return 'INFANT';
  if (age <= 4) return 'TODDLER';
  return age <= 11 ? 'CHILD' : 'ADULT';
}

export function passengersForBooking<T>(includeBooker: boolean, booker: T, extras: T[]): T[] {
  return [...(includeBooker ? [booker] : []), ...extras];
}

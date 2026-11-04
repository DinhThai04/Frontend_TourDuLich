import dayjs from 'dayjs';
import type { ITourDeparture } from '@/types/Tour';

export function departureCalendar(departures: ITourDeparture[], basePrice?: number, now = dayjs()) {
  const dates: Record<string, { id: number; price: string }> = {};
  const months = new Set<string>();
  for (const departure of departures) {
    if (typeof departure.departureDate !== 'string' || !departure.departureDate.trim()) continue;
    const date = dayjs(departure.departureDate);
    const id = Number(departure.id);
    if (!date.isValid() || !date.isAfter(now) || !Number.isSafeInteger(id) || id < 1) continue;
    // A sold-out departure is still OPEN in the catalogue; showing it leads to a dead checkout.
    if (departure.availableSeats !== undefined && Number(departure.availableSeats) < 1) continue;
    // Each departure carries its own price snapshot; fall back to the tour's base price.
    const adultPrice = departure.tourPrice?.adultPrice;
    const displayPrice = adultPrice && adultPrice > 0 ? adultPrice : basePrice;
    dates[date.format('YYYY-MM-DD')] = {
      id,
      // Nhóm theo kiểu Việt Nam và làm tròn nghìn: 'en-US' in ra "6,700K" và giá lẻ sẽ thành "6.750,5K".
      price: displayPrice !== undefined ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(displayPrice / 1000)}K` : '',
    };
    months.add(date.format('YYYY-MM'));
  }
  return { dates, months: [...months].sort() };
}

export function departureMonthStart(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const date = dayjs(`${month}-01`);
  return date.isValid() ? date.startOf('month') : null;
}

import dayjs from 'dayjs';
import type { ITour, ITourDeparture } from '@/types/Tour';

export function departureIdFromSearch(search: string) {
  const value = new URLSearchParams(search).get('departureId');
  const id = Number(value);
  return value && /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function isDepartureSalesClosed(departure: ITourDeparture, now = Date.now()) {
  const cutoff = departure.bookingCloseAt ? Date.parse(departure.bookingCloseAt) : NaN;
  return Number.isFinite(cutoff) && now >= cutoff;
}

export function formatBookingClose(departure: ITourDeparture) {
  const cutoff = departure.bookingCloseAt ? Date.parse(departure.bookingCloseAt) : NaN;
  return Number.isFinite(cutoff) ? new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(cutoff) : null;
}

export function isBookableDeparture(departure: ITourDeparture, now = Date.now()) {
  return (!departure.operationalStatus || departure.operationalStatus === 'OPEN') &&
    Number(departure.availableSeats) > 0 && !isDepartureSalesClosed(departure, now);
}

export function departureAdultPrice(tour: ITour, departure: ITourDeparture | null) {
  return departure ? departure.tourPrice?.adultPrice : tour.basePrice;
}

export function tourScheduleLink(tourId: number, departureId?: number) {
  return `/tours/detail/${tourId}${departureId ? `?departureId=${departureId}` : ''}#lich-khoi-hanh`;
}

export function departureCalendar(departures: ITourDeparture[], basePrice?: number, now = dayjs()) {
  const dates: Record<string, { id: number; price: string }> = {};
  const months = new Set<string>();
  const upcoming = departures.filter(departure => {
    if (typeof departure.departureDate !== 'string' || !departure.departureDate.trim()) return false;
    const date = dayjs(departure.departureDate);
    const id = Number(departure.id);
    return date.isValid() && date.isAfter(now) && Number.isSafeInteger(id) && id > 0 &&
      (!departure.operationalStatus || departure.operationalStatus === 'OPEN');
  }).sort((left, right) => left.departureDate.localeCompare(right.departureDate));
  const soldOutDays = new Set<string>();
  const closedDays = new Set<string>();
  for (const departure of upcoming) {
    const date = dayjs(departure.departureDate);
    const day = date.format('YYYY-MM-DD');
    months.add(date.format('YYYY-MM'));
    if (isDepartureSalesClosed(departure, now.valueOf())) {
      if (!dates[day]) closedDays.add(day);
      continue;
    }
    if (departure.availableSeats !== undefined && !isBookableDeparture(departure, now.valueOf())) {
      if (!dates[day]) soldOutDays.add(day);
      continue;
    }
    if (dates[day]) continue;
    soldOutDays.delete(day);
    closedDays.delete(day);
    const adultPrice = departure.tourPrice?.adultPrice;
    const displayPrice = adultPrice && adultPrice > 0 ? adultPrice : basePrice;
    dates[day] = {
      id: Number(departure.id),
      price: displayPrice !== undefined ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(displayPrice / 1000)}K` : '',
    };
  }
  return { dates, months: [...months], upcoming, soldOutDays, closedDays };
}

export function departureMonthStart(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const date = dayjs(`${month}-01`);
  return date.isValid() ? date.startOf('month') : null;
}

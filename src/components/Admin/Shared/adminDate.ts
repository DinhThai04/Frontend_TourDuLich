import { formatDate, parseDate } from '@/utils';

const time = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function formatAdminDatetime(value: string): string {
  const date = parseDate(value);
  return date ? `${formatDate(value)} · ${time.format(date)}` : '—';
}

const calendarDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
export function adminDayKey(value?: string): string {
  const date = value ? parseDate(value) : null;
  return date ? calendarDay.format(date) : '';
}

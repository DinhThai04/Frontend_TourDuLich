import dayjs from 'dayjs';

export const MOCK_BOOKINGS = [
  {
    id: 'BK001',
    date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    status: 'Xác nhận',
    tourName: 'Tour Nhật Bản',
    amount: 12500000,
  },
  {
    id: 'BK002',
    date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    status: 'Chưa xác nhận',
    tourName: 'Tour Hàn Quốc',
    amount: 9800000,
  },
  {
    id: 'BK003',
    date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    status: 'Đã hủy',
    tourName: 'Tour Thái Lan',
    amount: 4500000,
  },
];

export function seedBookingCache() {
  try {
    const existing = JSON.parse(sessionStorage.getItem('bookingHistoryCache') || 'null');
    if (!existing) sessionStorage.setItem('bookingHistoryCache', JSON.stringify(MOCK_BOOKINGS));
  } catch (e) {
    sessionStorage.setItem('bookingHistoryCache', JSON.stringify(MOCK_BOOKINGS));
  }
}

export default MOCK_BOOKINGS;

import { Navigate } from 'react-router-dom';
import { hasPermission, type RequiredPermission } from '@/config/access';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useAppSelector } from '@/store/hooks';

/**
 * Khu quản trị mở cho nhiều vai trò khác nhau, nên trang đích phải là trang đầu tiên
 * mà tài khoản thực sự có quyền. Trỏ cứng vào một trang sẽ đẩy các vai trò khác ra ngoài.
 */
const LANDING_PAGES: Array<{ permission: RequiredPermission; path: string }> = [
  { permission: P.BOOKINGS.GET_ALL, path: '/admin/managerBooking' },
  { permission: P.INVOICES.GET_ALL, path: '/admin/managerInvoice' },
  { permission: P.TOURS.GET_LIST, path: '/admin/managerTour/list' },
  { permission: P.USERS.GET_LIST, path: '/admin/managerUser' },
  { permission: P.TOUR_DEPARTURES.GET_LIST, path: '/admin/managerTour/tourDeparture' },
  { permission: P.PRICE.GET_LIST, path: '/admin/managerTour/price' },
  { permission: P.REVIEWS.GET_LIST, path: '/admin/managerTour/reviews' },
  { permission: P.ITINERARIES.GET_BY_TOUR, path: '/admin/managerTour/itinerary' },
  { permission: P.LOCATIONS.GET_DESTINATIONS, path: '/admin/managerTour/destination' },
  { permission: P.ROLES.GET_LIST, path: '/admin/role' },
  { permission: P.PERMISSIONS.GET_LIST, path: '/admin/managerRole' },
  { permission: P.PAYMENT_RECONCILIATION.GET_LIST, path: '/admin/paymentReconciliation' },
];

export default function AdminLanding() {
  const user = useAppSelector((state) => state.auth.user);
  const target = LANDING_PAGES.find((page) => hasPermission(user, page.permission));
  return <Navigate to={target?.path ?? '/'} replace />;
}

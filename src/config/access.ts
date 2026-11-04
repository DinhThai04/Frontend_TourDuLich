import type { User } from '@/types/User';

/** Quyền được khớp bằng mã ổn định; đường dẫn API chỉ là metadata nên đổi route không đổi quyền. */
export type RequiredPermission = { code?: string; anyOf?: readonly string[] };

/**
 * Cổng vào khu quản trị: mở cho vai trò có ít nhất một quyền của các trang quản trị.
 * Từng trang con vẫn kiểm tra đúng mã quyền của nó; vai trò khách hàng không có mã nào nên không lọt vào.
 */
export const ADMIN_ACCESS: RequiredPermission = {
  anyOf: [
    'INVOICES_GET_ALL',
    'RECONCILIATION_READ',
    'USERS_GET_LIST',
    'TOURS_GET_LIST',
    'BOOKINGS_GET_ALL',
    'ITINERARIES_GET_BY_TOUR',
    'LOCATIONS_GET_DESTINATIONS',
    'TOUR_DEPARTURES_GET_LIST',
    'PRICE_GET_LIST',
    'REVIEWS_GET_LIST',
    'ROLES_GET_LIST',
    'PERMISSIONS_GET_LIST',
  ],
};

export function hasPermission(user: User | null | undefined, required: RequiredPermission) {
  if (user?.status && user.status !== 'ACTIVE') return false;
  if (user?.role?.active === false) return false;
  if (user?.role?.name?.toLowerCase() === 'admin') return true;
  const wanted = [required.code, ...(required.anyOf ?? [])]
    .filter((code): code is string => !!code)
    .map(code => code.toUpperCase());
  if (!wanted.length) return false;
  const owned = new Set(
    (user?.role?.permissions ?? []).map(permission => permission.code?.toUpperCase()),
  );
  return wanted.some(code => owned.has(code));
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

type IRouteGuardProps = {
  isPrivate?: boolean; // true = chỉ cho login vào, false = chỉ cho chưa login vào
  redirectPath?: string; // đường dẫn fallback (mặc định là "/")
  roles?: string[]; // nếu truyền, chỉ cho các role này vào
};

export default function RouteGuard({ isPrivate, redirectPath = '/', roles }: IRouteGuardProps) {
  const { isAuth, user } = useAppSelector((state: RootState) => state.auth);

  // 1. Route chỉ dành cho user đã đăng nhập
  if (isPrivate === true && !isAuth) {
    return <Navigate to="/login" replace />;
  }

  // 2. Route chỉ dành cho user chưa đăng nhập (guest)
  if (isPrivate === false && isAuth) {
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Nếu có truyền roles → chỉ cho đúng role vào (VD: Admin, Nhân Viên)
  if (roles && roles.length > 0) {
    const userRoleName = user?.role?.name;

    // Nếu chưa login hoặc role không khớp → đá ra ngoài
    if (!userRoleName || !roles.includes(userRoleName)) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <Outlet />;
}

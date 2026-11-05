import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { hasPermission, type RequiredPermission } from '@/config/access';
type Props = { isPrivate?: boolean; redirectPath?: string; requiredPermission?: RequiredPermission };
export default function RouteGuard({ isPrivate, redirectPath = '/', requiredPermission }: Props) {
  const { isAuth, user } = useAppSelector(state => state.auth);
  const location = useLocation();
  // Login sends the visitor back here after authentication; the path is re-validated there.
  const attemptedPath = `${location.pathname}${location.search}${location.hash}`;
  if (isPrivate === true && !isAuth) return <Navigate to="/login" replace state={{ from: attemptedPath }} />;
  if (isPrivate === false && isAuth) return <Navigate to={redirectPath} replace />;
  if (requiredPermission && !hasPermission(user, requiredPermission)) return <Navigate to={redirectPath} replace />;
  return <Outlet />;
}

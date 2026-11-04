import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission, type RequiredPermission } from '@/config/access';
import { useAppSelector } from '@/store/hooks';

export default function PermissionGate({ permission, fallback = '/', children }: { permission: RequiredPermission; fallback?: string; children: ReactNode }) {
  const user = useAppSelector(state => state.auth.user);
  // Không mặc định về "/admin": index của khu admin lại trỏ vào route có gate,
  // nên vai trò thiếu quyền sẽ bị đẩy vòng lặp vô hạn.
  return hasPermission(user, permission) ? children : <Navigate to={fallback} replace />;
}

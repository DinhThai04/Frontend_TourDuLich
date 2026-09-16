// hooks/useHasPermission.ts
import type { RootState } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { useMemo } from 'react';

interface PermissionInput {
  method: string;
  apiPath: string;
}

export const useHasPermission = (perm: PermissionInput) => {
  const user = useAppSelector((state: RootState) => state.auth.user);

  const permissions = user?.role?.permissions ?? [];

  const hasPermission = useMemo(() => {
    if (!perm || !perm.method || !perm.apiPath) return false;
    if (!permissions.length) return false;

    return permissions.some((p) => p.method === perm.method && p.apiPath === perm.apiPath);
  }, [permissions, perm.method, perm.apiPath]);

  return hasPermission;
};

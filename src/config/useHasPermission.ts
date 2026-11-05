import type { RootState } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { hasPermission as checkPermission, type RequiredPermission } from './access';

export const useHasPermission = (perm: RequiredPermission) => {
  const user = useAppSelector((state: RootState) => state.auth.user);

  return checkPermission(user, perm);
};

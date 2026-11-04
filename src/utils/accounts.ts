import type { User } from '@/types/User';
export type AccountAction = 'LOCK' | 'UNLOCK' | 'ARCHIVE' | 'DELETE';
export const accountStatusLabels = { ACTIVE:'Hoạt động', LOCKED:'Đã khóa', ARCHIVED:'Đã lưu trữ' };
export function availableAccountActions(user: User, current: User | null, grants: { status: boolean; archive: boolean; delete: boolean }): AccountAction[] {
  if (!current || current.status && current.status !== 'ACTIVE' || user.managementAllowed === false || String(current.id) === String(user.id)) return [];
  const status=user.status ?? 'ACTIVE';
  if (status==='ARCHIVED') return [];
  const actions: AccountAction[]=[];
  if(grants.status)actions.push(status==='ACTIVE'?'LOCK':'UNLOCK');
  if(status==='LOCKED' && grants.archive)actions.push('ARCHIVE');
  if(status==='LOCKED' && grants.delete)actions.push('DELETE');
  return actions;
}

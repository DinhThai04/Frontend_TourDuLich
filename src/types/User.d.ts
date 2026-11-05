export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
export interface AccountEvent { id: number; targetUserId: number; actorId: number; action: string; previousStatus: AccountStatus; newStatus: AccountStatus | null; reason: string; createdAt: string }
export type User = {
  status?: AccountStatus;
  managementAllowed?: boolean;
  id: number;
  username: string;
  avatar?: string;
  address: string;
  email: string;
  phone: string;
  role: Role;
  permissions: Permission[];
};

export interface IUserUpdate {
  username?: string;
  file?: File;
  phone?: string;
  address?: string;
}

export interface IUserCreate {
  username: string;
  email: string;
  phone: string;
  address: string;
  roleId: number;
  password: string;
}

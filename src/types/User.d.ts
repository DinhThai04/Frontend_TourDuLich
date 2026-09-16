export type User = {
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

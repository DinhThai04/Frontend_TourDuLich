import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';

export type RoleInput = Pick<Role, 'name' | 'description' | 'active'> & { permissions: { id: number }[] };

export const createRole = (role: RoleInput): Promise<ApiResponse<Role>> => {
  return axiosClient.post('/auth/roles', role);
};

export const updateRole = (role: RoleInput & { id: number }): Promise<ApiResponse<Role>> => {
  return axiosClient.put('/auth/roles', role);
};

export const getRoles = (): Promise<ApiResponse<Role[]>> => {
  return axiosClient.get('/auth/roles');
};

export const getRoleById = (id: number): Promise<ApiResponse<Role>> => {
  return axiosClient.get(`/auth/roles/${id}`);
};

export const deleteRole = (id: number): Promise<ApiResponse<void>> => {
  return axiosClient.delete(`/auth/roles/${id}`);
};

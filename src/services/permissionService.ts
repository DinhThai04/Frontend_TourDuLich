import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';
import type { PermissionInput, Permission } from '@/types/Permission';

const getPermissions = (): Promise<ApiResponse<Permission[]>> => {
  return axiosClient.get('auth/permissions/list');
};

const createPermission = async (permission: PermissionInput): Promise<ApiResponse<Permission>> => {
  return axiosClient.post('auth/permissions', permission);
};

const updatePermission = async (permission: PermissionInput): Promise<ApiResponse<Permission>> => {
  return axiosClient.put('auth/permissions', permission);
};

const deletePermission = async (id: number): Promise<ApiResponse<Permission>> => {
  return axiosClient.delete(`auth/permissions/${id}`);
};

const getPermissionById = async (id: number): Promise<ApiResponse<Permission>> => {
  return axiosClient.get(`auth/permissions/${id}`);
};

export { getPermissions, createPermission, updatePermission, deletePermission, getPermissionById };

import axiosClient from '@/api/axios';
import type { AxiosResponse } from '@/types/comment';
import type { Permission } from '@/types/Permission';

const getPermissions = (): Promise<AxiosResponse> => {
  return axiosClient.get('auth/permissions/list');
};

const createPermission = async (permission: Permission): Promise<AxiosResponse> => {
  return axiosClient.post('auth/permissions', permission);
};

const updatePermission = async (permission: Permission): Promise<AxiosResponse> => {
  return axiosClient.put('auth/permissions', permission);
};

const deletePermission = async (id: number): Promise<AxiosResponse> => {
  return axiosClient.delete(`auth/permissions/${id}`);
};

const getPermissionById = async (id: number): Promise<AxiosResponse> => {
  return axiosClient.get(`auth/permissions/${id}`);
};

export { getPermissions, createPermission, updatePermission, deletePermission, getPermissionById };

import axiosClient from '@/api/axios';
import type { AxiosResponse } from '@/types/comment';

export const createRole = (role: Role): Promise<AxiosResponse> => {
  return axiosClient.post('auth/roles', role);
};

export const updateRole = (role: Role): Promise<AxiosResponse> => {
  return axiosClient.put('auth/roles', role);
};

export const getRoles = (): Promise<AxiosResponse> => {
  return axiosClient.get('auth/roles');
};

export const getRoleById = (id: number): Promise<AxiosResponse> => {
  return axiosClient.get(`auth/roles/${id}`);
};

export const deleteRole = (id: number): Promise<AxiosResponse> => {
  return axiosClient.delete(`auth/roles/${id}`);
};

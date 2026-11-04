import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';
import type { IUserCreate, IUserUpdate, User, AccountStatus, AccountEvent } from '@/types/User';
import { sessionService } from './sessionServices';
import { listPageParams, type ListQuery } from '@/utils';

export const updateProfile = async (
  data: IUserUpdate,
  id: number | undefined
): Promise<ApiResponse<User>> => {
  const formData = new FormData();
  if (data.file) {
    formData.append('file', data.file);
  }
  if (data.username) {
    formData.append('username', data.username);
  }
  if (data.phone) {
    formData.append('phone', data.phone);
  }
  if (data.address) {
    formData.append('address', data.address);
  }

  const response: ApiResponse<User> = await axiosClient.post(`auth/users/UpdateUser/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (response.code === 1000 && String(response.result.id) === String(id)) sessionService.updateCurrentUser(id, response.result);
  return response;
};

export const getUserById = (id: number | string): Promise<ApiResponse<User>> => {
  return axiosClient.get(`auth/users/${id}`);
};

export const getAllUsers = (query?: ListQuery): Promise<ApiResponse> => {
  return axiosClient.get(`/auth/users/list`, { params: listPageParams(query) });
};

/** Display labels only; booking staff do not need access to the full user directory. */
export async function getUserDisplayNames(ids: (string | number | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.map(String).filter(id => /^[1-9]\d*$/.test(id)))];
  const names: Record<string, string> = {};
  for (let offset = 0; offset < unique.length; offset += 100) {
    const params = new URLSearchParams({ ids: unique.slice(offset, offset + 100).join(',') });
    const response: ApiResponse<Record<string, string>> = await axiosClient.get(`auth/users/display-names?${params}`);
    if (response.code !== 1000) throw new Error('Chưa tải được tên tài khoản đặt tour.');
    Object.assign(names, response.result);
  }
  return names;
}
export const getListUser = (query?: ListQuery): Promise<ApiResponse<User[]>> => {
  return axiosClient.get(`/auth/users/list`, { params: listPageParams(query) });
};
export const updateAvt = async (
  data: IUserUpdate,
  id: number | undefined
): Promise<ApiResponse<{ originalFileName: string; url: string }>> => {
  const formData = new FormData();
  if (data.file) {
    formData.append('file', data.file);
  }
  const response: ApiResponse<{ originalFileName: string; url: string }> = await axiosClient.post(`auth/users/updateAvtUser/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (response.code === 1000) sessionService.updateCurrentUser(id, { avatar: response.result.url });
  return response;
};

export const createUser = (data: IUserCreate): Promise<ApiResponse> => {
  return axiosClient.post('/auth/users', data);
};

export const updateUser = (data: IUserUpdate & { roleId?: number }, id: number | undefined): Promise<ApiResponse> => {
  const formData = new FormData();
  if (data.username) formData.append('username', data.username);
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', data.address);
  if (data.roleId) formData.append('roleId', String(data.roleId));

  return axiosClient.post(`auth/users/UpdateUser/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteUser = (id: number, reason: string): Promise<ApiResponse<void>> => {
  return axiosClient.delete(`/auth/users/${id}`, { params: { reason } });
};

export const setAccountStatus = (id: number, status: Exclude<AccountStatus, 'ARCHIVED'>, reason: string): Promise<ApiResponse<User>> =>
  axiosClient.put(`auth/users/${id}/status`, { status, reason });
export const archiveAccount = (id: number, reason: string): Promise<ApiResponse<User>> =>
  axiosClient.post(`auth/users/${id}/archive`, { reason });
export const accountEvents = (id: number): Promise<ApiResponse<AccountEvent[]>> => axiosClient.get(`auth/users/${id}/events`);

import axiosClient from '@/api/axios';
import type { AxiosResponse } from '@/types/comment';
import type { IUserCreate, IUserUpdate, User } from '@/types/User';

export const updateProfile = (
  data: IUserUpdate,
  id: number | undefined
): Promise<AxiosResponse<User>> => {
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

  return axiosClient.post(`auth/users/UpdateUser/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getAllUsers = (): Promise<AxiosResponse> => {
  return axiosClient.get(`auth/users/list`);
};
export const getListUser = (): Promise<AxiosResponse> => {
  return axiosClient.get('auth/users/list');
};
export const updateAvt = (
  data: IUserUpdate,
  id: number | undefined
): Promise<AxiosResponse<User>> => {
  const formData = new FormData();
  if (data.file) {
    formData.append('file', data.file);
  }
  return axiosClient.post(`auth/users/updateAvtUser/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const createUser = (data: IUserCreate): Promise<AxiosResponse> => {
  return axiosClient.post('auth/users/register', data);
};

export const updateUser = (data: IUserUpdate, id: number | undefined): Promise<AxiosResponse> => {
  const formData = new FormData();
  if (data.username) formData.append('username', data.username);
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', data.address);
  // @ts-expect-error allow roleId if present in data model
  if (data.roleId) formData.append('roleId', String(data.roleId));

  return axiosClient.post(`auth/users/UpdateUser/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteUser = (id: number): Promise<AxiosResponse> => {
  return axiosClient.delete(`auth/users/${id}`);
};

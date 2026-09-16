import axiosClient from '@/api/axios';
import type {
  ChangePWReq,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ReviewResponse,
} from '@/types/Auth';
import { sessionService } from './sessionServices';
import axios from 'axios';
import type { AxiosResponse, CreateCommentRequest } from '@/types/comment';

export const loginService = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const res: LoginResponse = await axiosClient.post('/auth/users/login', data);
    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const serverError = err.response?.data as { message?: string };
      throw new Error(serverError?.message || 'Đăng nhập thất bại');
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unexpected error');
  }
};
export const loginWithGGService = async (googleToken: string) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/users/google`,
      {},
      {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      }
    );
    if (res.data.code === 1000) {
      return res.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error('Đăng nhập thất bại');
  }
};

export const registerService = async (data: RegisterRequest) => {
  try {
    const res: RegisterResponse = await axiosClient.post('/auth/users/register', data);
    console.log('>>>', res);
    if (res.code !== 1000) {
      throw new Error(res?.message || 'Register failed');
    }
    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const serverError = err.response?.data as { message?: string };
      throw new Error(serverError?.message || 'Register failed');
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unexpected error');
  }
};

export const logoutService = async (token: string): Promise<void> => {
  try {
    await axiosClient.post('/auth/users/logout', { token });
  } finally {
    sessionService.clearSession();
  }
};

export const refreshTokenService = async (token: string): Promise<LoginResponse> => {
  try {
    const res: LoginResponse = await axiosClient.post('/auth/users/refresh', token);

    if (res.code !== 1000) {
      throw new Error(res?.message || 'Refresh failed');
    }
    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const serverError = err.response?.data as { message?: string };
      throw new Error(serverError?.message || 'Refresh failed');
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unexpected error');
  }
};

export const changePW = async (data: ChangePWReq): Promise<AxiosResponse> => {
  return axiosClient.post('/auth/users/Change-password', data);
};

export const getListComentByTour = (id: number): Promise<AxiosResponse> => {
  return axiosClient.get(`/auth/reviews/tour/${id}`);
};

export const getListComentByTourALll = (): Promise<AxiosResponse> => {
  return axiosClient.get(`/auth/reviews/list`);
};

export const createComent = (data: CreateCommentRequest): Promise<AxiosResponse> => {
  return axiosClient.post('/auth/reviews', data);
};

export const getHighReviews = (size: number = 3): Promise<AxiosResponse<ReviewResponse[]>> => {
  return axiosClient.get(`/auth/reviews/high-rating?size=${size}`);
};

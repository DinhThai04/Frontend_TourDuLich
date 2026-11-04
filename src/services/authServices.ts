import axiosClient from '@/api/axios';
import type {
  ChangePWReq,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TourReviewsResponse,
} from '@/types/Auth';
import axios from 'axios';
import type { ApiResponse, CreateCommentRequest, ReviewResponse } from '@/types/comment';
import { listPageParams, type ListQuery } from '@/utils';

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
export const loginWithGGService = async (googleToken: string): Promise<LoginResponse> => {
  try {
    // The Google ID token travels in Authorization; axiosClient keeps that header for auth routes.
    const res: LoginResponse = await axiosClient.post(
      '/auth/users/google',
      {},
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );
    if (res.code !== 1000) {
      throw new Error(res?.message || 'Đăng nhập thất bại');
    }
    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const serverError = err.response?.data as { message?: string };
      throw new Error(serverError?.message || 'Đăng nhập thất bại');
    }
    if (err instanceof Error) throw err;
    throw new Error('Đăng nhập thất bại');
  }
};

export const registerService = async (data: RegisterRequest) => {
  try {
    const res: RegisterResponse = await axiosClient.post('/auth/users/register', data);
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

export const logoutService = async (token: string, refreshToken?: string): Promise<void> => {
  // A missing access token must not skip revoking a refresh token that is still valid.
  if (!token && !refreshToken) return;
  // Revoke the captured tokens only; local logout must not wait on the server.
  await axiosClient.post('/auth/users/logout', { token: token || undefined, refreshToken }, { timeout: 5000 });
};

export const changePW = async (data: ChangePWReq): Promise<ApiResponse> => {
  return axiosClient.post('/auth/users/Change-password', data);
};

export const getReviewsByTour = (
  id: number,
  query?: { page?: number; size?: number },
): Promise<ApiResponse<ReviewResponse[]>> => {
  return axiosClient.get(`/auth/reviews/tour/${id}`, { params: query });
};

export const getAllReviews = (query?: ListQuery): Promise<ApiResponse<TourReviewsResponse[]>> => {
  return axiosClient.get(`/auth/reviews/list`, { params: listPageParams(query) });
};

export const createReview = (data: CreateCommentRequest): Promise<ApiResponse<ReviewResponse>> => {
  return axiosClient.post('/auth/reviews', data);
};

export const getReviewEligibility = (
  tourId: number,
): Promise<ApiResponse<{ eligible: boolean; message: string }>> => {
  return axiosClient.get(`/auth/reviews/eligibility?tourId=${tourId}`);
};

export const getHighReviews = (size: number = 3): Promise<ApiResponse<ReviewResponse[]>> => {
  return axiosClient.get(`/auth/reviews/high-rating?size=${size}`);
};

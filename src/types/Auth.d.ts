import type { ReviewResponse } from './comment';
import type { User } from './User.d';

export type AuthState = {
  isAuth: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  expiryTime: string | null;
  error: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};
export type RegisterRequest = {
  username: string;
  password: string;
  email: string;
  phone: string;
  address: string;
};

export type LoginResponse = {
  code: number;
  message?: string;
  result: {
    token: string;
    /** Chỉ gửi tới /auth/users/refresh, không dùng cho request API thường. */
    refreshToken: string;
    expiryTime: string;
    user: User;
  };
};
export type RegisterResponse = {
  code: number;
  message?: string;
  result: {
    id: number;
    username: string;
    email: string;
  };
};

export type ChangePWReq = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export interface TourReviewsResponse { tourId: number; tourName: string; reviews: ReviewResponse[] }

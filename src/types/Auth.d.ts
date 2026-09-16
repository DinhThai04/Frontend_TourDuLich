import type { UserResponse } from './comment';
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
  firstName: string;
  lastName: string;
  roleId: number;
  dob?: string;
  city?: string;
};

export type LoginResponse = {
  code: number;
  message?: string;
  result: {
    token: string;
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
  token: string;
};

export type ReviewResponse = {
  id: number;
  tourId: number;
  user: UserResponse;
  content: string;
  rating: number;
  createdAt: string;
};

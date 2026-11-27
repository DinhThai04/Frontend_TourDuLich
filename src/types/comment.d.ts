export interface UserResponse {
  id: number;
  username: string;
  avatar?: string;
  address: string;
  email: string;
  phone: string;
  role: Role;
  permissions: Permission[];
}

export interface ReviewResponse {
  id: number;
  tourId: number;
  user: UserResponse;
  content: string;
  rating: number;
  createdAt: string;
}

export interface CreateCommentRequest {
  tourId: number;
  content: string;
  rating: number;
  userId?: number;
}

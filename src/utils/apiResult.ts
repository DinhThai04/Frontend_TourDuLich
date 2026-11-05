import type { ApiResponse } from '@/types/comment';

/**
 * Backend luôn trả `code = 1000` khi thành công (không dùng 200/201 trong body),
 * nên mọi màn hình cần kiểm tra thống nhất qua helper này.
 */
export const isApiSuccess = (response: Pick<ApiResponse<unknown>, 'code'> | null | undefined): boolean =>
  response?.code === 1000;

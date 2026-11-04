import type { ApiResponse } from '@/types/comment';

/** Rows from a settled request; a failed or non-1000 source contributes nothing. */
export function settledRows<T>(result: PromiseSettledResult<ApiResponse<T[]>>): T[] {
  return result.status === 'fulfilled' && result.value.code === 1000 ? result.value.result ?? [] : [];
}

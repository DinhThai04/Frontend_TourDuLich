/** Envelope returned by the backend. */
export interface ApiResponse<T = unknown> {
  result: T;
  message: string;
  code: number;
}

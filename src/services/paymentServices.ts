import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';
import type { PaymentQuote } from '@/types/Invoice';

const paymentServices = {
  /** Giá server tính cho booking, dùng để hiển thị và làm expectedAmount. */
  quote: (bookingId: number): Promise<ApiResponse<PaymentQuote>> => {
    return axiosClient.get(`/payment/vnpay/bookings/${bookingId}/quote`);
  },

  create: (data: { bookingId: number; expectedAmount: string }): Promise<string> => {
    return axiosClient.post('/payment/vnpay/bookings', data);
  },

  get: (
    callbackUrl: string,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResponse<Record<string, unknown> | string>> => {
    return axiosClient.get(callbackUrl, { signal: options?.signal });
  },
};

export default paymentServices;

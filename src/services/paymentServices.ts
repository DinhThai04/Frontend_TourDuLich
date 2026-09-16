import axiosClient from '@/api/axios';
import type { PaymentRequest } from '@/types/Payment';
import type { AxiosResponse } from '@/types/comment';

const PAYMENT_API = '/payment/vnpay';
console.log(PAYMENT_API); // log để build
const paymentServices = {
  create: (data: PaymentRequest): Promise<AxiosResponse<string>> => {
    return axiosClient.post('/payment/vnpay', data);
  },

  get: (callbackUrl: string): Promise<AxiosResponse> => {
    return axiosClient.get(callbackUrl);
  },
};

export default paymentServices;

import axiosClient from "@/api/axios";
import type { AxiosResponse } from '@/types/comment';

const INVOICE_API = "/invoice/direct";

const invoiceServices = {
  /**
   * 
   * @param data 
   * @returns 
   */
  create: (data: any): Promise<AxiosResponse> => {
    return axiosClient.post(`${INVOICE_API}/create`, data);
  },

  /**
   * 
   * @returns 
   */
  getAll: (): Promise<AxiosResponse> => {
    return axiosClient.get(`${INVOICE_API}/all`);
  },

  /**
   * 
   * @param id 
   * @returns 
   */
  getById: (id: number): Promise<AxiosResponse> => {
    return axiosClient.get(`${INVOICE_API}/${id}`);
  },

  /**
   * 
   * @param bookingId 
   * @returns 
   */
  getByBookingId: (bookingId: number): Promise<AxiosResponse> => {
    return axiosClient.get(`${INVOICE_API}/booking/${bookingId}`);
  },
};

export default invoiceServices;

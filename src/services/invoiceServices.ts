import type { InvoiceResponse } from '@/types/Invoice';
import axiosClient from "@/api/axios";
import type { ApiResponse } from '@/types/comment';
import { listPageParams, type ListQuery } from '@/utils';

const INVOICE_API = "/invoice/direct";

const invoiceServices = {
  getAll: (query?: ListQuery): Promise<ApiResponse<InvoiceResponse[]>> => {
    return axiosClient.get(`${INVOICE_API}/all`, { params: listPageParams(query) });
  },

  getById: (id: number): Promise<ApiResponse<InvoiceResponse>> => {
    return axiosClient.get(`${INVOICE_API}/${id}`);
  },

  getByBookingId: (bookingId: number): Promise<ApiResponse<InvoiceResponse>> => {
    return axiosClient.get(`${INVOICE_API}/booking/${bookingId}`);
  },
};

export default invoiceServices;

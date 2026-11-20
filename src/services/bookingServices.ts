import axiosClient from '@/api/axios';
import type { BookingRequest, BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ApiResponse } from '@/types/comment';
import { listPageParams, type ListQuery } from '@/utils';

const BOOKING_API = '/booking/book';
const CUSTOMER_API = '/booking/customer';

export type BookingHistoryRow = {
  booking: BookingResponse; tourCode?: string; tourTitle?: string; departureDate?: string; returnDate?: string; invoiceStatus?: string;
};

const bookingServices = {
  create: (data: BookingRequest): Promise<ApiResponse<BookingResponse>> => {
    return axiosClient.post(`${BOOKING_API}/create`, data);
  },

  getAll: (query?: ListQuery): Promise<ApiResponse<BookingResponse[]>> => {
    return axiosClient.get(`${BOOKING_API}/all`, { params: listPageParams(query) });
  },

  paymentStatus: (id: number, signal?: AbortSignal): Promise<ApiResponse<{ bookings: { bookingId: number; state: string }[] }>> => {
    return axiosClient.get('/booking/advice/mine', { params: { bookingId: id }, signal });
  },

  getById: (id: number): Promise<ApiResponse<BookingResponse>> => {
    return axiosClient.get(`${BOOKING_API}/${id}`);
  },

  findOwnAttempt: (key: string): Promise<ApiResponse<BookingResponse | null>> =>
    axiosClient.get(`${BOOKING_API}/attempt`, { params: { key } }),

  ownHistory: (params: { page?: number; bookingId?: number; status?: string; from?: string; to?: string }):
    Promise<ApiResponse<{ items: BookingHistoryRow[]; hasNext: boolean }>> =>
    axiosClient.get(`${BOOKING_API}/history`, { params }),

  delete: (id: number): Promise<ApiResponse> => {
    return axiosClient.delete(`${BOOKING_API}/${id}`);
  },

  getAllCustomers: (query?: ListQuery): Promise<ApiResponse<CustomerResponse[]>> => {
    return axiosClient.get(`${CUSTOMER_API}/all`, { params: listPageParams(query) });
  },

  getListOfCustomersByBookingId: (id: number): Promise<ApiResponse<CustomerResponse[]>> => {
    return axiosClient.get(`${CUSTOMER_API}/booking/${id}`);
  },
};

export default bookingServices;

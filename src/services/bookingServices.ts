import axiosClient from '@/api/axios';
import type { BookingRequest, BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ApiResponse } from '@/types/comment';
import { listPageParams, type ListQuery } from '@/utils';

const BOOKING_API = '/booking/book';
const CUSTOMER_API = '/booking/customer';

const bookingServices = {
  create: (data: BookingRequest): Promise<ApiResponse<BookingResponse>> => {
    return axiosClient.post(`${BOOKING_API}/create`, data);
  },

  getAll: (query?: ListQuery): Promise<ApiResponse<BookingResponse[]>> => {
    return axiosClient.get(`${BOOKING_API}/all`, { params: listPageParams(query) });
  },

  getById: (id: number): Promise<ApiResponse<BookingResponse>> => {
    return axiosClient.get(`${BOOKING_API}/${id}`);
  },

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

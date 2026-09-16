import axiosClient from '@/api/axios';
import type { BookingRequest } from '@/types/Booking';
import type { AxiosResponse } from '@/types/comment';

const BOOKING_API = '/booking/book';
const CUSTOMER_API = '/booking/customer';

const bookingServices = {
  /**
   *
   * @param data
   * @returns
   */
  create: (data: BookingRequest): Promise<AxiosResponse> => {
    return axiosClient.post(`${BOOKING_API}/create`, data);
  },

  /**
   *
   * @returns
   */
  getAll: (): Promise<AxiosResponse> => {
    return axiosClient.get(`${BOOKING_API}/all`);
  },

  /**
   *
   * @param id
   * @returns
   */
  getById: (id: number): Promise<AxiosResponse> => {
    return axiosClient.get(`${BOOKING_API}/${id}`);
  },

  /**
   *
   * @param id
   * @returns
   */
  delete: (id: number): Promise<AxiosResponse> => {
    return axiosClient.delete(`${BOOKING_API}/${id}`);
  },

  /**
   *
   * @returns
   */
  getAllCustomers: (): Promise<AxiosResponse> => {
    return axiosClient.get(`${CUSTOMER_API}/all`);
  },

  /**
   *
   * @param id
   * @returns
   */
  getListOfCustomersByBookingId: (id: number): Promise<AxiosResponse> => {
    return axiosClient.get(`${CUSTOMER_API}/booking/${id}`);
  },

  updateStatus: (id: number): Promise<AxiosResponse> => {
    return axiosClient.put(`${BOOKING_API}/status/${id}`);
  },
};

export default bookingServices;

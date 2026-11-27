import axiosClient from '@/api/axios';
import type { BookingRequest, BookingResponse, CustomerResponse } from '@/types/Booking';
import type { ApiResponse } from '@/types/api';
import { listPageParams, type ListQuery } from '@/utils';

const BOOKING_API = '/booking/book';
const CUSTOMER_API = '/booking/customer';

export type BookingHistoryRow = {
  booking: BookingResponse; tourCode?: string; tourTitle?: string; departureDate?: string; returnDate?: string; invoiceStatus?: string; totalAmount?: number;
};

const bookingServices = {
  create: (data: BookingRequest): Promise<ApiResponse<BookingResponse>> => {
    return axiosClient.post(`${BOOKING_API}/create`, data);
  },

  getAll: (query?: ListQuery & { departureId?: number }): Promise<ApiResponse<BookingResponse[]>> => {
    return axiosClient.get(`${BOOKING_API}/all`, { params: { ...listPageParams(query), departureId: query?.departureId } });
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


export type BookingPickupOption = {
  confirmationKey: string;
  address: string;
  landmark?: string;
  arrivalTime?: string;
  directionsUrl?: string;
};

export type BookingPickupChoices = {
  options: BookingPickupOption[];
  selectedKey?: string;
  pickupStatus?: import('./departureManifest').PickupStatus;
  chooseUntil?: string;
  editable: boolean;
};

export const getAdminBookingPickup = (id: number, signal?: AbortSignal): Promise<ApiResponse<BookingPickupChoices>> =>
  axiosClient.get(`${BOOKING_API}/${id}/pickup/admin`, { signal });

export const assignBookingPickup = (id: number, confirmationKey: string, reason: string): Promise<ApiResponse<BookingPickupChoices>> =>
  axiosClient.put(`${BOOKING_API}/${id}/pickup/admin`, { confirmationKey, reason });

export const getBookingPickup = (id: number): Promise<ApiResponse<BookingPickupChoices>> =>
  axiosClient.get(`${BOOKING_API}/${id}/pickup`);

export const chooseBookingPickup = (id: number, confirmationKey: string): Promise<ApiResponse<BookingPickupChoices>> =>
  axiosClient.put(`${BOOKING_API}/${id}/pickup`, { confirmationKey });

export const announceBookingPickup = (departureId: number): Promise<ApiResponse<{
  queued: number;
  alreadyQueued: number;
  withoutEmail: number;
}>> => axiosClient.post(`${BOOKING_API}/departures/${departureId}/pickup-announcements`);

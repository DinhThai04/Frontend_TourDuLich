import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/api';
import type { IPaginationResponse } from '@/types/Pagination';
import { createReadCache } from '@/utils/readCache';
import type {
  AddTourPriceRequest,
  ICity,
  IItinerary,
  ILocation,
  AddItineraryRequest,
  ITour,
  ITourDeparture,
  ITourPrice,
  IVehicle,
  AddLocationRequest,
  TourRequest,
  UpdateTourPriceRequest,
  UpdateTourRequest,
  UpdateLocationRequest,
  UpdateItineraryRequest,
  AddTourDepartureRequest,
  UpdateTourDepartureRequest,
} from '@/types/Tour';

const catalog = createReadCache();
// Chuỗi timeout: tour_service chờ file_service 60s (Feign readTimeout), Gateway trả lời sau 90s,
// nginx cắt ở 120s. Trình duyệt phải chờ lâu hơn Gateway để nhận lỗi có cấu trúc thay vì tự cắt.
const UPLOAD_TIMEOUT_MS = 95_000;
const referenceData = <T>(path: string): Promise<ApiResponse<T>> => catalog.get(
  path, () => axiosClient.get<unknown, ApiResponse<T>>(path), response => response.code === 1000
);
const invalidateCatalog = <T>(response: ApiResponse<T>) => {
  if (response.code === 1000) catalog.invalidate();
  return response;
};

export const searchTours = (
  params: URLSearchParams, signal?: AbortSignal
): Promise<ApiResponse<IPaginationResponse<ITour>>> => {
  return axiosClient.get(`/tour/tours/search?${params.toString()}`, { signal });
};

export const getAllTours = (): Promise<ApiResponse<ITour[]>> => {
  return axiosClient.get('/tour/tours/list');
};

export const getRandom3Tour = (
  excludeId?: number, signal?: AbortSignal
): Promise<ApiResponse<ITour[]>> => {
  return axiosClient.get('/tour/tours/random-3', {
    params: excludeId ? { excludeId } : undefined,
    signal,
  });
};

export const getTourById = (id: number, signal?: AbortSignal): Promise<ApiResponse<ITour>> => {
  return axiosClient.get(`/tour/tours/${id}`, { signal });
};

export const getDepartureByTourId = (id: number, signal?: AbortSignal): Promise<ApiResponse<ITourDeparture[]>> => {
  return axiosClient.get(`/tour/tour-departures/tour/${id}`, { signal });
};

export type UpcomingDeparture = Pick<ITourDeparture, 'id' | 'tourId' | 'tourCode' | 'departureDate' | 'availableSeats' | 'capacity'> & {
  tourTitle: string;
};

export const getUpcomingDepartures = (page: number, day?: string): Promise<ApiResponse<{ items: UpcomingDeparture[]; hasNext: boolean }>> =>
  axiosClient.get('/tour/tour-departures/upcoming', { params: { page, day } });

/** Admin view: includes past, suspended and cancelled departures. */
export const getDepartureHistoryByTourId = (id: number): Promise<ApiResponse<ITourDeparture[]>> => {
  return axiosClient.get(`/tour/tour-departures/tour/${id}/all`);
};

export const getAllTourDeparture = (): Promise<ApiResponse<ITourDeparture[]>> => {
  return axiosClient.get(`/tour/tour-departures/list`);
};

export const getTourDepartureById = (id: number, signal?: AbortSignal): Promise<ApiResponse<ITourDeparture>> => {
  return axiosClient.get(`/tour/tour-departures/${id}`, { signal });
};

export type MeetingPoint = { confirmationKey?: string; address?: string; landmark?: string; arrivalTime?: string | null; directionsUrl?: string };
export const getMeetingPoint = (id: number, tourId?: number): Promise<ApiResponse<MeetingPoint | null>> =>
  axiosClient.get(`/tour/tour-departures/${id}/meeting-point`, { params: { tourId } });
export const saveMeetingPoint = (id: number, point: MeetingPoint): Promise<ApiResponse<MeetingPoint | null>> =>
  axiosClient.put(`/tour/tour-departures/${id}/meeting-point`, point);

export const getMeetingPointOptions = (id: number, tourId?: number): Promise<ApiResponse<MeetingPoint[]>> =>
  axiosClient.get(`/tour/tour-departures/${id}/meeting-point/options`, { params: { tourId } });
export const saveMeetingPointOptions = (id: number, points: MeetingPoint[]): Promise<ApiResponse<MeetingPoint[]>> =>
  axiosClient.put(`/tour/tour-departures/${id}/meeting-point/options`, points);

export const getItineraryByTourId = (id: number): Promise<ApiResponse<IItinerary[]>> => {
  return axiosClient.get(`/tour/itineraries/tour/${id}`);
};

export const getAllLocation = (): Promise<ApiResponse<ILocation[]>> => {
  return referenceData('/tour/locations/all');
};

export const getAllDepartures = (): Promise<ApiResponse<ILocation[]>> => {
  return referenceData('/tour/locations/departures');
};

export const getAllDestinations = (): Promise<ApiResponse<ILocation[]>> => {
  return referenceData('/tour/locations/destinations');
};
export const getRandom7Destinations = (): Promise<ApiResponse<ILocation[]>> => {
  return axiosClient.get(`/tour/locations/destinations/attractive`);
};

export const getAllVehicles = (): Promise<ApiResponse<IVehicle[]>> => {
  return referenceData('/tour/vehicles/list');
};

export const getAllItineraries = (): Promise<ApiResponse<IItinerary[]>> => {
  return axiosClient.get(`/tour/itineraries/all`);
};

export const getAllPrice = (): Promise<ApiResponse<ITourPrice[]>> => {
  return axiosClient.get(`/pricing/prices`);
};

export const searchLocation = (
  key: string,
  isDep: boolean = true, signal?: AbortSignal
): Promise<ApiResponse<ICity[]>> => {
  return axiosClient.get(
    `/tour/locations/${isDep ? 'departures' : 'destinations'}/search?${new URLSearchParams({ keyword: key })}`, { signal }
  );
};

export const addLocation = (data: AddLocationRequest): Promise<ApiResponse<ILocation>> => {
  const formData = new FormData();

  formData.append('city', data.city);
  formData.append('type', data.type);
  if (data.img) {
    formData.append('img', data.img);
  }

  return axiosClient.post<unknown, ApiResponse<ILocation>>(`/tour/locations`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: UPLOAD_TIMEOUT_MS,
  }).then(invalidateCatalog);
};

export const addItinerary = (data: AddItineraryRequest): Promise<ApiResponse<IItinerary>> => {
  return axiosClient.post(`tour/itineraries`, data);
};

export const addPrice = (data: AddTourPriceRequest): Promise<ApiResponse<ITourPrice>> => {
  return axiosClient.post(`pricing/prices`, data);
};

export const addTourDeparture = (
  data: AddTourDepartureRequest
): Promise<ApiResponse<ITourDeparture>> => {
  return axiosClient.post(`tour/tour-departures`, data);
};

export const addTour = (data: TourRequest): Promise<ApiResponse<ITour>> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      value.forEach((file: File) => formData.append('files', file));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return axiosClient.post(`tour/tours`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: UPLOAD_TIMEOUT_MS,
  });
};

export const updateTour = (data: UpdateTourRequest): Promise<ApiResponse<ITour>> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      // Xử lý file mới
      value.forEach((file: File) => {
        formData.append('files', file);
      });
    } else if (key === 'url' && Array.isArray(value)) {
      // Xử lý url ảnh cần xóa
      value.forEach((url: string) => {
        formData.append('url', url);
      });
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return axiosClient.put(`tour/tours/${data.id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
};

export const retryTourImages = (id: number, files: File[]): Promise<ApiResponse<ITour>> => {
  const data = new FormData();
  files.forEach(file => data.append('files', file));
  return axiosClient.post(`tour/tours/${id}/images`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
};

export const updateTourPrice = (
  data: UpdateTourPriceRequest
): Promise<ApiResponse<ITourPrice>> => {
  return axiosClient.put(`pricing/prices/${data.id}`, data);
};

export const updateLocation = (data: UpdateLocationRequest): Promise<ApiResponse<ILocation>> => {
  const formData = new FormData();

  formData.append('city', data.city ?? '');
  formData.append('type', data.type ?? '');
  if (data.img) {
    formData.append('img', data.img);
  }

  return axiosClient.put<unknown, ApiResponse<ILocation>>(`/tour/locations/${data.id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: UPLOAD_TIMEOUT_MS,
  }).then(invalidateCatalog);
};

export const updateItinerary = (
  data: UpdateItineraryRequest
): Promise<ApiResponse<IItinerary>> => {
  return axiosClient.put(`tour/itineraries/${data.id}`, data);
};

export const updateTourDeparture = (
  data: UpdateTourDepartureRequest
): Promise<ApiResponse<ITourDeparture>> => {
  return axiosClient.put(`tour/tour-departures/${data.id}`, data);
};

export const assignDepartureVehicle = (id: number, vehicleId: string | null): Promise<ApiResponse<ITourDeparture>> =>
  axiosClient.put(`/tour/tour-departures/${id}/vehicle`, { vehicleId });

export const openTourDeparture = (id: number): Promise<ApiResponse<ITourDeparture>> =>
  axiosClient.post(`/tour/tour-departures/${id}/open`);

export const getDepartureCapacity = (id: number): Promise<{ code: number; result: import('@/utils/departureCapacity').DepartureCapacity }> => {
  return axiosClient.get(`tour/tour-departures/${id}/capacity`);
};

export const deleteTour = (id: number): Promise<ApiResponse<void>> =>
  axiosClient.delete(`/tour/tours/${id}`);

export const deleteItinerary = (id: number): Promise<ApiResponse<void>> => {
  return axiosClient.delete(`tour/itineraries/${id}`);
};

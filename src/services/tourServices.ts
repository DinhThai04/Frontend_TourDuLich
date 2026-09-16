import axiosClient from '@/api/axios';
import type { AxiosResponse } from '@/types/comment';
import type { IPaginationResponse } from '@/types/Pagination';
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

export const searchTours = (
  params: URLSearchParams
): Promise<AxiosResponse<IPaginationResponse<ITour>>> => {
  return axiosClient.get(`/tour/tours/search?${params.toString()}`);
};

export const getAllTours = (): Promise<AxiosResponse<ITour[]>> => {
  return axiosClient.get('/tour/tours/list');
};

export const getRandom3Tour = (): Promise<AxiosResponse<ITour[]>> => {
  return axiosClient.get('/tour/tours/random-3');
};

export const getTourById = (id: number): Promise<AxiosResponse<ITour>> => {
  return axiosClient.get(`/tour/tours/${id}`);
};

export const getDepartureByTourId = (id: number): Promise<AxiosResponse<ITourDeparture[]>> => {
  return axiosClient.get(`/tour/tour-departures/tour/${id}`);
};

export const getAllTourDeparture = (): Promise<AxiosResponse<ITourDeparture[]>> => {
  return axiosClient.get(`/tour/tour-departures/list`);
};

export const getTourDepartureById = (id: number): Promise<AxiosResponse<ITourDeparture>> => {
  return axiosClient.get(`/tour/tour-departures/${id}`);
};

export const getItineraryByTourId = (id: number): Promise<AxiosResponse<IItinerary[]>> => {
  return axiosClient.get(`/tour/itineraries/tour/${id}`);
};

export const getAllLocation = (): Promise<AxiosResponse<ILocation[]>> => {
  return axiosClient.get(`/tour/locations/all`);
};

export const getAllDepartures = (): Promise<AxiosResponse<ILocation[]>> => {
  return axiosClient.get(`/tour/locations/departures`);
};

export const getAllDestinations = (): Promise<AxiosResponse<ILocation[]>> => {
  return axiosClient.get(`/tour/locations/destinations`);
};
export const getRandom7Destinations = (): Promise<AxiosResponse<ILocation[]>> => {
  return axiosClient.get(`/tour/locations/destinations/attractive`);
};

export const getAllVehicles = (): Promise<AxiosResponse<IVehicle[]>> => {
  return axiosClient.get(`/tour/vehicles/list`);
};

export const getAllItineraries = (): Promise<AxiosResponse<IItinerary[]>> => {
  return axiosClient.get(`/tour/itineraries/all`);
};

export const getAllPrice = (): Promise<AxiosResponse<ITourPrice[]>> => {
  return axiosClient.get(`/pricing/prices`);
};

export const searchLocation = (
  key: string,
  isDep: boolean = true
): Promise<AxiosResponse<ICity[]>> => {
  return axiosClient.get(
    `/tour/locations/${isDep ? 'departures' : 'destinations'}/search?keyword=${key}`
  );
};

export const addLocation = (data: AddLocationRequest): Promise<AxiosResponse<ILocation>> => {
  const formData = new FormData();

  formData.append('city', data.city);
  formData.append('type', data.type);
  if (data.img) {
    formData.append('img', data.img);
  }

  return axiosClient.post(`/tour/locations`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const addItinerary = (data: AddItineraryRequest): Promise<AxiosResponse<IItinerary>> => {
  return axiosClient.post(`tour/itineraries`, data);
};

export const addPrice = (data: AddTourPriceRequest): Promise<AxiosResponse<ITourPrice>> => {
  return axiosClient.post(`pricing/prices`, data);
};

export const addTourDeparture = (
  data: AddTourDepartureRequest
): Promise<AxiosResponse<ITourDeparture>> => {
  return axiosClient.post(`tour/tour-departures`, data);
};

export const addTour = (data: TourRequest): Promise<AxiosResponse<ITour>> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      value.forEach((file: File) => formData.append('files', file));
    } else {
      formData.append(key, String(value));
    }
  });

  return axiosClient.post(`tour/tours`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateTour = (data: UpdateTourRequest): Promise<AxiosResponse<ITour>> => {
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
  });
};

export const updateTourPrice = (
  data: UpdateTourPriceRequest
): Promise<AxiosResponse<ITourPrice>> => {
  return axiosClient.put(`pricing/prices/${data.id}`, data);
};

export const updateLocation = (data: UpdateLocationRequest): Promise<AxiosResponse<ILocation>> => {
  const formData = new FormData();

  formData.append('city', data.city ?? '');
  formData.append('type', data.type ?? '');
  if (data.img) {
    formData.append('img', data.img);
  }

  return axiosClient.put(`/tour/locations/${data.id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateItinerary = (
  data: UpdateItineraryRequest
): Promise<AxiosResponse<IItinerary>> => {
  return axiosClient.put(`tour/itineraries/${data.id}`, data);
};

export const updateTourDeparture = (
  data: UpdateTourDepartureRequest
): Promise<AxiosResponse<ITourDeparture>> => {
  return axiosClient.put(`tour/tour-departures/${data.id}`, data);
};

export const deleteItinerary = (id: number): Promise<AxiosResponse<any>> => {
  return axiosClient.delete(`tour/itineraries/${id}`);
};

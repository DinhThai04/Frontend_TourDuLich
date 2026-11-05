import type { UploadFile } from 'antd';
import type { ITourPrice, TourRequest, IItinerary } from './Tour';
export type PriceFormValues = Omit<ITourPrice, 'id'>;
export type ItineraryFormValues = Pick<IItinerary, 'title' | 'description' | 'meal'>;
export interface LocationFormValues { name?: string; city?: string; type: string; img: UploadFile[] }
export type TourFormValues = Omit<TourRequest, 'files'> & { files?: UploadFile[]; deletedImageUrls?: string[] };
export interface UserFormValues { username: string; email: string; phone: string; address: string; role: number; password: string }
export type PermissionOption = { id: number; name: string; method: import('./Permission').Permission['method']; apiPath: string; enabled: boolean };

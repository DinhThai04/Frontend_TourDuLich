import axiosClient from '@/api/axios';

export interface DetachedImage { id: string; url: string; publicId: string | null; verified: boolean }
export interface DetachedPage { content: DetachedImage[]; totalElements: number; number: number }
export const getDetachedImages = (page: number): Promise<DetachedPage> => axiosClient.get(`file/media/tour-orphans?page=${page}`);
export const deleteDetachedImage = (id: string): Promise<void> => axiosClient.delete(`file/media/tour-orphans/${encodeURIComponent(id)}`);

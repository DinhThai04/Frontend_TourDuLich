import type { UploadFile } from 'antd';
import type { ITour, TourRequest } from '@/types/Tour';

export const MAX_TOUR_IMAGES = 10;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function imageFileError(file: Pick<File, 'size' | 'type'>): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chỉ nhận ảnh JPEG, PNG hoặc WebP';
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return 'Mỗi ảnh phải có dung lượng từ 1 byte đến 5 MB';
  return null;
}
export function imageBatchError(files: UploadFile[] = []): string | null {
  if (files.length > MAX_TOUR_IMAGES) return 'Mỗi tour tối đa 10 ảnh';
  let total = 0;
  for (const item of files) {
    if (!item.originFileObj) continue;
    const error = imageFileError(item.originFileObj);
    if (error) return error;
    total += item.originFileObj.size;
  }
  return total > MAX_UPLOAD_BYTES ? 'Tổng ảnh tải lên mỗi lần tối đa 25 MB' : null;
}
type Result = { code: number; result: ITour; message?: string };
export function submitTourMedia(pendingId: number | null, data: TourRequest,
  create: (data: TourRequest) => Promise<Result>, retry: (id: number, files: File[]) => Promise<Result>) {
  return pendingId === null ? create(data) : retry(pendingId, data.files ?? []);
}
export function mediaError(error: unknown): string {
  const failure = error as { response?: { data?: { message?: string } } };
  return failure?.response?.data?.message || 'Chưa hoàn tất thao tác. Hãy kiểm tra danh sách tour trước khi thử tạo lại nếu kết nối bị gián đoạn.';
}
/** Deleting the last image on a page shifts every later row, so the requested page can fall off the end. */
export function pageWithinRange(totalElements: number, requested: number, pageSize: number): number {
  const lastPage = Math.max(0, Math.ceil(totalElements / pageSize) - 1);
  return Math.min(Math.max(0, requested), lastPage);
}

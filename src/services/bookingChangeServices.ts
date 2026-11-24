import api from '@/api/axios';
import { listPageParams, type ListQuery } from '@/utils';

export interface ChangeRequest {
  id: number; booking_id: number; kind: 'CUSTOMER' | 'SHOP'; status: string; version: number;
  active_key: number | null; tour_title: string; username?: string; email?: string;
  response_deadline?: string;
  source_departure_at: string; target_departure_at: string; target_departure_id: number;
  reason: string; paid_amount?: number; refund_amount?: number; refund_reference?: string; refund_requested: boolean;
  events?: { action: string; note: string; actor_id: number; created_at: string }[];
}
export interface DepartureOption { id: number; departure_date: string; return_date: string; available_seats: number }
export type PendingScheduleChange = Pick<ChangeRequest, 'id' | 'booking_id' | 'kind' | 'status' | 'source_departure_at' | 'tour_title'> & {
  tour_id: number;
};
export interface EligibleBooking { id: number; tour_title: string; departure_date: string }
export interface ShopProposal { id: number; source_departure_id: number; target_departure_id: number; status: string; reason: string; evidence: string; response_deadline: string }
export interface ShopInput {
  clientKey: string; sourceId: number; expectedVersion: number; reasonCode: string; reason: string;
  evidence: string; originalCannotDepart: boolean; departureAt: string; returnAt: string;
  capacity: number; responseDeadline: string;
}
interface Response<T> { code: number; result: T; message?: string }
export function changeError(error: unknown) {
  const response = error as { response?: { data?: { message?: string } } };
  return response.response?.data?.message || (error instanceof Error ? error.message : 'Không xử lý được dời lịch');
}
async function unwrap<T>(request: Promise<Response<T>>) {
  const result = await request;
  if (result.code !== 1000) throw new Error(result.message || 'Không xử lý được yêu cầu');
  return result.result;
}
const root = '/booking/changes';
export const bookingChanges = {
  mine: (bookingId?: number) => unwrap<ChangeRequest[]>(api.get(`${root}/mine`, { params: { bookingId } })),
  eligible: () => unwrap<EligibleBooking[]>(api.get(`${root}/eligible`)),
  options: (bookingId: number) => unwrap<DepartureOption[]>(api.get(`${root}/options`, { params: { bookingId } })),
  customer: (bookingId: number, targetId: number, reason: string, clientKey: string) =>
    unwrap<ChangeRequest>(api.post(`${root}/customer`, { bookingId, targetId, reason, clientKey })),
  respond: (row: ChangeRequest, action: string, note: string, targetId?: number) =>
    unwrap<ChangeRequest>(api.post(`${root}/${row.id}/respond`, { action, note, targetId, expectedVersion: row.version })),
  admin: (tourId?: number, query?: ListQuery, requestId?: number) =>
    unwrap<{ requests: ChangeRequest[]; proposals: ShopProposal[] }>(
      api.get(`${root}/admin`, { params: { ...listPageParams(query), tourId, requestId } }),
    ),
  pending: (page: number, filters?: { bookingId?: number; day?: string; customerAction?: boolean }) => unwrap<{ items: PendingScheduleChange[]; hasNext: boolean }>(
    api.get(`${root}/admin/pending`, { params: { page, ...filters } }),
  ),
  preview: (input: ShopInput) => unwrap<{ bookingCount: number; occupiedSeats: number; capacity: number; version: number }>(api.post(`${root}/shop/preview`, input)),
  shop: (input: ShopInput) => unwrap<ShopProposal>(api.post(`${root}/shop`, input)),
  review: (row: ChangeRequest, action: string, note: string) =>
    unwrap<ChangeRequest>(api.post(`${root}/${row.id}/review`, { action, note, expectedVersion: row.version })),
  refund: (row: ChangeRequest, amount: number, reference: string, note: string, externalRefundCompleted: boolean) =>
    unwrap<ChangeRequest>(api.post(`${root}/${row.id}/refund`, { expectedVersion: row.version, amount, reference, note, externalRefundCompleted })),
  activate: (id: number) => unwrap<ShopProposal>(api.post(`${root}/shop/${id}/activate`)),
};

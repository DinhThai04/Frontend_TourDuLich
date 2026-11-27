import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/api';

export type Attendance = 'EXPECTED' | 'BOARDED' | 'NO_SHOW' | 'RETURNED' | 'SEPARATED' | 'UNVERIFIED_RETURN';
export type PickupStatus = 'MISSING' | 'CONFIRMED' | 'NEEDS_RECONFIRMATION';
export type ManifestPassenger = { customerId: number; bookingId: number; name: string; status: Attendance; note?: string; meetingPointName?: string; pickupTime?: string; accountId: number; guardianNote?: string; pickupStatus: PickupStatus };
export type Manifest = {
  phase: 'SCHEDULED' | 'BOARDING' | 'IN_PROGRESS' | 'AWAITING_CLOSEOUT' | 'COMPLETED' | 'CANCELLED' | 'INCIDENT' | 'OVERDUE_UNCONFIRMED';
  completedAt?: string;
  actualDepartureAt?: string;
  confirmedBy?: number;
  outcome?: string;
  completedBy?: number;
  closeoutNote?: string;
  passengers: ManifestPassenger[];
  guideAccountId?: number | null;
};

export type Progress = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'SKIPPED';
export type Checkpoint = { id: number; day: number; title: string; status: Progress; actualTime?: string; note?: string };
export type TripReport = {
  guideId: number; status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  summary: string; incidentNote?: string; handoverNote?: string; adminComment?: string;
};

const path = (departureId: number) => `/booking/operations/departures/${departureId}/manifest`;

export type DepartureAlert = {
  departureId: number;
  tourId: number;
  code: string;
  title: string;
  departure: string;
  issue: 'OVERDUE_UNCONFIRMED' | 'MISSING_GUIDE' | 'MISSING_VEHICLE' | 'OVER_CAPACITY' | 'MISSING_PICKUP' | 'NEEDS_RECONFIRMATION';
  bookingId?: number | null;
  passengers?: number;
  vehicleCapacity?: number;
};

export const departureManifest = {
  alerts: (page: number, size: number, bookingId?: number, day?: string):
    Promise<ApiResponse<{ items: DepartureAlert[]; total: number; hasNext: boolean }>> =>
    axiosClient.get('/booking/operations/departures/alerts', { params: { page, size, bookingId, day } }),
  assigned: (): Promise<ApiResponse<number[]>> => axiosClient.get('/booking/operations/departures/assigned'),
  assign: (id: number, accountId: number | null, forceOverride = false, reason?: string): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/guide`, { accountId, forceOverride, reason }),
  get: (id: number, signal?: AbortSignal): Promise<ApiResponse<Manifest>> => axiosClient.get(path(id), { signal }),
  mark: (id: number, customerId: number, status: Attendance, note?: string): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/passengers/${customerId}`, { status, note }),
  confirm: (id: number, actualDepartureAt?: string, reason?: string): Promise<ApiResponse<Manifest>> =>
    axiosClient.post(`/tour/departures/${id}/confirm-departure`, { actualDepartureAt, reason }),
  complete: (id: number, note: string, override = false): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/completion`, { note, override }),
  guideConflicts: (id: number, guideIds: number[], signal?: AbortSignal): Promise<ApiResponse<Record<number, number>>> =>
    axiosClient.get(`${path(id)}/guide-conflicts`, { params: { guideIds: guideIds.join(',') }, signal }),
  contacts: (id: number): Promise<ApiResponse<Record<number, string>>> => axiosClient.get(`${path(id)}/contacts`),
  checkpoints: (id: number): Promise<ApiResponse<Checkpoint[]>> => axiosClient.get(`${path(id)}/itinerary`),
  progress: (id: number, checkpointId: number, status: Progress, note: string): Promise<ApiResponse<Checkpoint[]>> =>
    axiosClient.patch(`${path(id)}/itinerary/${checkpointId}`, { status, note }),
  report: (id: number): Promise<ApiResponse<TripReport | null>> => axiosClient.get(`${path(id)}/report`),
  saveReport: (id: number, body: Pick<TripReport, 'summary' | 'incidentNote' | 'handoverNote'> & { submit: boolean }): Promise<ApiResponse<TripReport>> =>
    axiosClient.put(`${path(id)}/report`, body),
  review: (id: number, approve: boolean, comment: string): Promise<ApiResponse<TripReport>> =>
    axiosClient.post(`${path(id)}/report/review`, { approve, comment }),
};

export const tripPhaseLabel: Record<Manifest['phase'], string> = {
  SCHEDULED: 'Sắp khởi hành', BOARDING: 'Đang mở điểm danh', IN_PROGRESS: 'Đang diễn ra',
  AWAITING_CLOSEOUT: 'Chờ chốt', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', INCIDENT: 'Đang xử lý sự cố',
  OVERDUE_UNCONFIRMED: 'Quá giờ, chưa xác nhận khởi hành',
};
export const hasBoarded = (p: ManifestPassenger) => ['BOARDED', 'RETURNED', 'SEPARATED', 'UNVERIFIED_RETURN'].includes(p.status);

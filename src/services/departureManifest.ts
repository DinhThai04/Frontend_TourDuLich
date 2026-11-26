import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';

export type Attendance = 'EXPECTED' | 'BOARDED' | 'NO_SHOW' | 'RETURNED';
export type ManifestPassenger = { customerId: number; bookingId: number; name: string; status: Attendance };
export type Manifest = {
  phase: 'SCHEDULED' | 'BOARDING' | 'IN_PROGRESS' | 'AWAITING_CLOSEOUT' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  completedAt?: string;
  completedBy?: number;
  closeoutNote?: string;
  passengers: ManifestPassenger[];
  guideAccountId?: number | null;
};

const path = (departureId: number) => `/booking/operations/departures/${departureId}/manifest`;

export const departureManifest = {
  assigned: (): Promise<ApiResponse<number[]>> => axiosClient.get('/booking/operations/departures/assigned'),
  assign: (id: number, accountId: number | null): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/guide`, { accountId }),
  get: (id: number, signal?: AbortSignal): Promise<ApiResponse<Manifest>> => axiosClient.get(path(id), { signal }),
  mark: (id: number, customerId: number, status: Attendance): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/passengers/${customerId}`, { status }),
  complete: (id: number, note: string): Promise<ApiResponse<Manifest>> =>
    axiosClient.put(`${path(id)}/completion`, { note }),
};

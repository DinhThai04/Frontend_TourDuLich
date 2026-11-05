import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';

export type ReconciliationAction = 'UNPAID_CONFIRMED' | 'PAYMENT_FOUND' | 'REFUND_RECORDED';
export type ReconciliationRow = {
  txn_ref: string; booking_id: number; account_id: number; username: string; email: string;
  amount_vnd: number; status: string; case_status: string | null; reason: string | null;
  created_at: string; expires_at: string; provider_paid_at: string | null; provider: string;
};
export type ReconciliationEvent = { id: number; actor_id: number; actor_name: string | null; action: ReconciliationAction;
  amount_vnd: number; reference: string; note: string; created_at: string };
export type ReconciliationDecision = { action: ReconciliationAction; amountVnd: number; reference: string;
  note: string; confirmed: boolean; providerPaidAt?: string };
export const reconciliationServices = {
  list: (page: number, view: string): Promise<ApiResponse<{ items: ReconciliationRow[]; hasNext: boolean }>> =>
    axiosClient.get('/payment/reconciliation', { params: { page, view } }),
  history: (ref: string): Promise<ApiResponse<ReconciliationEvent[]>> => axiosClient.get(`/payment/reconciliation/${encodeURIComponent(ref)}/history`),
  resolve: (ref: string, input: ReconciliationDecision): Promise<ApiResponse<Pick<ReconciliationRow, 'txn_ref' | 'status'>>> =>
    axiosClient.post(`/payment/reconciliation/${encodeURIComponent(ref)}/resolve`, input),
};

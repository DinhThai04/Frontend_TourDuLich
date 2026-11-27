export type OrderBadgeStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export function resolveOrderBadgeStatus(input: {
  status?: string | null;
  reservationStatus?: string | null;
  invoiceStatus?: string | null;
  tripCompleted?: boolean;
}): OrderBadgeStatus {
  const s = (input.status || '').toUpperCase();
  const r = (input.reservationStatus || '').toUpperCase();
  const inv = (input.invoiceStatus || '').toUpperCase();

  if (s === 'CANCELLED' || s === 'UNCONFIRMED' || r === 'CANCELLED') return 'CANCELLED';
  if (s === 'EXPIRED' || r === 'EXPIRED') return 'EXPIRED';

  const isPaid = r === 'PAID' || inv === 'PAID';
  if (isPaid) {
    return s === 'COMPLETED' || input.tripCompleted ? 'COMPLETED' : 'PAID';
  }
  return 'PENDING';
}

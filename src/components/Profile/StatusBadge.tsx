export type OrderBadgeStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

const BADGE_STYLES: Record<OrderBadgeStatus, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Chờ thanh toán' },
  PAID: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A', label: 'Đã thanh toán' },
  COMPLETED: { bg: '#E6F4F1', text: '#134E48', dot: '#1F7A6E', label: 'Đã hoàn thành' },
  EXPIRED: { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF', label: 'Hết hạn thanh toán' },
  CANCELLED: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626', label: 'Đã hủy' },
};

export function resolveOrderBadgeStatus(input: {
  status?: string | null;
  reservationStatus?: string | null;
  invoiceStatus?: string | null;
  returnDate?: string | null;
}): OrderBadgeStatus {
  const s = (input.status || '').toUpperCase();
  const r = (input.reservationStatus || '').toUpperCase();
  const inv = (input.invoiceStatus || '').toUpperCase();

  if (s === 'CANCELLED' || s === 'UNCONFIRMED' || r === 'CANCELLED') return 'CANCELLED';
  if (s === 'EXPIRED' || r === 'EXPIRED') return 'EXPIRED';

  const isPaid = r === 'PAID' || inv === 'PAID';
  if (isPaid) {
    const ended = input.returnDate ? new Date(input.returnDate).getTime() < Date.now() : false;
    return s === 'COMPLETED' || ended ? 'COMPLETED' : 'PAID';
  }
  return 'PENDING';
}

export default function StatusBadge({ status }: { status: OrderBadgeStatus }) {
  const cfg = BADGE_STYLES[status];
  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-4"
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: cfg.dot }}
        className="h-1.5 w-1.5 shrink-0 rounded-full"
      />
      {cfg.label}
    </span>
  );
}

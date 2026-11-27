import { useState } from 'react';
import { Alert, Button, Card, DatePicker, Empty, Select, Space, Tabs, Tooltip, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '@/api/axios';
import type { ApiResponse } from '@/types/api';
import AdminLookup from '@/components/Admin/Shared/AdminLookup';
import AdminPagination from '@/components/Admin/Shared/AdminPagination';
import { useAdminPagination } from '@/components/Admin/Shared/useAdminPagination';
import { AdminTable } from '@/components/Admin/Shared/AdminTable';
import { AdminStatus } from '@/components/Admin/Shared/AdminStatus';
import { formatAdminDatetime } from '@/components/Admin/Shared/adminDate';
import { useApiQuery } from '@/hooks';
import { reconciliationServices } from '@/services/reconciliationServices';
import { departureManifest, type DepartureAlert } from '@/services/departureManifest';
import { bookingChanges } from '@/services/bookingChangeServices';
import { formatCurrencyVND } from '@/utils';
import { errorMessage } from '@/utils/errors';

type Kind = 'PAYMENT' | 'CHANGE' | 'INTEGRITY' | 'DEPARTURE';
type Work = { id: string; kind: Kind; bookingId?: number; subject: string; detail: string; createdAt?: string; href: string };
type Queue = { items: Work[]; total: number; hasNext: boolean };
type Review = { checkedAt: string; items: { booking_id: number; issue: string }[] };
const names: Record<Kind, string> = { PAYMENT: 'Đối soát', CHANGE: 'Yêu cầu dời lịch', INTEGRITY: 'Đơn cần rà soát', DEPARTURE: 'Vận hành chuyến' };
const departureIssues: Record<DepartureAlert['issue'], string> = {
  OVERDUE_UNCONFIRMED: 'Quá giờ, chưa xác nhận khởi hành',
  MISSING_GUIDE: 'Chưa phân công hướng dẫn viên',
  MISSING_VEHICLE: 'Chưa gán xe có sức chứa',
  OVER_CAPACITY: 'Số khách vượt sức chứa xe',
  MISSING_PICKUP: 'Đơn đã thanh toán chưa chọn điểm đón',
  NEEDS_RECONFIRMATION: 'Điểm đón đã thay đổi, cần xác nhận lại',
};
const integrityPath = '/booking/operations/integrity';
const issueLabels: Record<string, string> = {
  MISSING_PAID_INVOICE: 'Đã ghi nhận thanh toán nhưng thiếu hóa đơn',
  MISSING_PAID_PAYMENT: 'Hóa đơn đã thanh toán nhưng thiếu khoản thu',
  OVERDUE_HOLD: 'Giữ chỗ đã quá hạn',
};

export default function AdminInbox({ payment, changes, integrity, operations }: { payment: boolean; changes: boolean; integrity: boolean; operations: boolean }) {
  const { page, size, mode, change, tableRef } = useAdminPagination();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') === 'integrity' ? 'INTEGRITY' : params.get('category');
  const kinds: Kind[] = [...(payment ? ['PAYMENT' as const] : []), ...(changes ? ['CHANGE' as const] : []), ...(operations ? ['DEPARTURE' as const] : []), ...(integrity ? ['INTEGRITY' as const] : [])];
  const kind = kinds.find(item => item === requested) ?? 'ALL';
  const [handler, setHandler] = useState('ALL');
  const [day, setDay] = useState<string>();
  const [bookingId, setBookingId] = useState<number>();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Review>();

  const { data, loading, error, refresh } = useApiQuery(async () => {
    const active = handler !== 'CUSTOMER';
    const readers: Record<Kind, (index: number) => Promise<Queue>> = {
      PAYMENT: async index => {
        if (!active) return { items: [], total: 0, hasNext: false };
        const response = await reconciliationServices.list(index, 'ACTIONABLE', { size, bookingId, day });
        if (response.code !== 1000) throw new Error(response.message);
        const result = response.result;
        return { total: result.total ?? result.items.length, hasNext: result.hasNext, items: result.items.map(row => ({
          id: `payment-${row.txn_ref}`, kind: 'PAYMENT', bookingId: row.booking_id, subject: row.provider,
          detail: formatCurrencyVND(Number(row.amount_vnd)), createdAt: row.created_at,
          href: `/admin/paymentReconciliation?txnRef=${encodeURIComponent(row.txn_ref)}`,
        })) };
      },
      CHANGE: async index => {
        const result = await bookingChanges.pending(index, { size, bookingId, day, customerAction: handler === 'ALL' ? undefined : !active });
        return { total: result.total ?? result.items.length, hasNext: result.hasNext, items: result.items.map(row => ({
          id: `change-${row.id}`, kind: 'CHANGE', bookingId: row.booking_id, subject: `Yêu cầu #${row.id}`,
          detail: row.tour_title, createdAt: row.created_at,
          href: `/admin/managerTour/tourDeparture?tourId=${row.tour_id}&requestId=${row.id}`,
        })) };
      },
      DEPARTURE: async index => {
        if (!active) return { items: [], total: 0, hasNext: false };
        const response = await departureManifest.alerts(index, size, bookingId, day);
        if (response.code !== 1000) throw new Error(response.message);
        const result = response.result;
        return { total: result.total, hasNext: result.hasNext, items: result.items.map(row => ({
          id: `departure-${row.departureId}-${row.issue}-${row.bookingId ?? 0}`,
          kind: 'DEPARTURE', bookingId: row.bookingId ?? undefined, subject: row.code || `Lịch #${row.departureId}`,
          detail: `${departureIssues[row.issue]}${row.issue === 'OVER_CAPACITY' ? ` (${row.passengers}/${row.vehicleCapacity} chỗ)` : ''} · ${row.title}`,
          createdAt: row.departure,
          href: `/admin/tours/${row.tourId}/departures?departureId=${row.departureId}&operation=1${row.bookingId ? `&pickupBookingId=${row.bookingId}` : ''}`,
        })) };
      },
      INTEGRITY: async () => ({ items: [], total: 0, hasNext: false }),
    };
    let review: Review | undefined = scanResult;
    if (integrity && !review) {
      const response: ApiResponse<Review> = await axios.get(integrityPath);
      if (response.code !== 1000) throw new Error(response.message);
      review = response.result;
    }
    const byBooking = new Map<number, string[]>();
    for (const item of active ? review?.items ?? [] : []) {
      if (bookingId && item.booking_id !== bookingId) continue;
      if (day && review?.checkedAt.slice(0, 10) !== day) continue;
      byBooking.set(item.booking_id, [...(byBooking.get(item.booking_id) ?? []), issueLabels[item.issue] ?? item.issue]);
    }
    const flagged: Work[] = [...byBooking.entries()].map(([id, issues]) => ({
      id: `integrity-${id}`, kind: 'INTEGRITY', bookingId: id, subject: `Đơn #${id}`,
      detail: issues.join(' · '), createdAt: review?.checkedAt, href: `/admin/managerBooking?bookingId=${id}`,
    }));
    readers.INTEGRITY = async index => ({
      items: flagged.slice(index * size, (index + 1) * size), total: flagged.length, hasNext: (index + 1) * size < flagged.length,
    });

    const queues = await Promise.all(kinds.map(async queueKind => ({ queueKind, first: await readers[queueKind](0) })));
    const selected = queues.filter(queue => kind === 'ALL' || queue.queueKind === kind);
    const total = selected.reduce((sum, queue) => sum + queue.first.total, 0);
    const current = Math.min(page, Math.max(1, Math.ceil(total / size)));
    let start = (current - 1) * size;
    let limit = start + size;
    const slices: Promise<Work[]>[] = [];
    for (const { queueKind, first } of selected) {
      if (start < first.total && limit > 0) {
        const from = Math.max(0, start);
        const through = Math.min(first.total, limit);
        const low = Math.floor(from / size);
        const high = Math.floor((through - 1) / size);
        slices.push(Promise.all(Array.from({ length: high - low + 1 }, (_, i) =>
          low + i === 0 ? first : readers[queueKind](low + i))).then(parts =>
          parts.flatMap(part => part.items).slice(from - low * size, through - low * size)));
      }
      start -= first.total;
      limit -= first.total;
    }
    return { rows: (await Promise.all(slices)).flat(), current, total, queues, checkedAt: review?.checkedAt };
  }, { deps: [kind, day, bookingId, handler, page, size, scanResult, payment, changes, integrity, operations] });

  async function scan() {
    setScanning(true);
    try {
      const response: ApiResponse<Review> = await axios.post(integrityPath + '/rescan');
      if (response.code !== 1000) throw new Error(response.message);
      setScanResult(response.result);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setScanning(false);
    }
  }

  return <Card><div ref={tableRef} className="admin-inbox-body">
    <Tabs activeKey={kind} onChange={category => setParams({ category, page: '1', size: String(mode) })} items={[
      { key: 'ALL', label: `Tất cả${data ? ` (${data.queues.reduce((sum, item) => sum + item.first.total, 0)})` : ''}` },
      ...kinds.map(key => {
        const count = data?.queues.find(queue => queue.queueKind === key)?.first.total;
        return { key, label: `${names[key]}${count == null ? '' : ` (${count})`}` };
      }),
    ]} />
    <Space wrap>
      <AdminLookup value={bookingId ? String(bookingId) : ''} placeholder="Mã đơn"
        onLookup={value => {
          const digits = value.replace(/^#/, '');
          if (value && (!/^\d+$/.test(digits) || Number(digits) > 2147483647)) return;
          setBookingId(Number(digits) || undefined);
          if (page !== 1) change(1);
        }} />
      <Select aria-label="Người xử lý tiếp" value={handler} onChange={value => { setHandler(value); if (page !== 1) change(1); }}
        options={[{ value: 'ALL', label: 'Mọi người xử lý' }, { value: 'STAFF', label: 'Nhân viên' }, { value: 'CUSTOMER', label: 'Chờ khách phản hồi' }]} />
      <DatePicker aria-label="Ngày nghiệp vụ" format="DD/MM/YYYY" onChange={value => {
        setDay(value?.format('YYYY-MM-DD'));
        if (page !== 1) change(1);
      }} />
      <Tooltip title="Làm mới"><Button aria-label="Làm mới" icon={<ReloadOutlined />} loading={loading} onClick={() => { setScanResult(undefined); void refresh(); }} /></Tooltip>
      {kind === 'INTEGRITY' && <Button loading={scanning} onClick={() => void scan()}>Quét lại</Button>}
    </Space>
    {kind === 'INTEGRITY' && data?.checkedAt && <p className="admin-muted">Quét lần cuối {formatAdminDatetime(data.checkedAt)}.</p>}
    {error && <Alert showIcon type="error" message={error} />}
    <AdminTable<Work> rowKey="id" pagination={false} loading={loading} dataSource={data?.rows}
      locale={{ emptyText: <Empty description="Không có việc cần xử lý trong bộ lọc này" /> }} columns={[
        { title: 'Loại', render: (_, row) => <AdminStatus tone={row.kind === 'INTEGRITY' || row.kind === 'DEPARTURE' ? 'attention' : 'info'}>{names[row.kind]}</AdminStatus> },
        { title: 'Đối tượng', render: (_, row) => row.bookingId ? <><strong>Đơn #{row.bookingId}</strong><div className="text-xs">{row.subject}</div></> : <strong>{row.subject}</strong> },
        { title: 'Nội dung', dataIndex: 'detail' },
        { title: 'Tạo lúc', render: (_, row) => row.createdAt ? formatAdminDatetime(row.createdAt) : '—' },
        { title: 'Thao tác', render: (_, row) => <Link to={row.href}>Xử lý</Link> },
      ]} />
    {data && <AdminPagination mode={mode} page={data.current} size={size} total={data.total} onChange={change} />}
  </div></Card>;
}

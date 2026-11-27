import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, Popover, Space, Spin } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { useApiQuery } from '@/hooks';
import { reconciliationServices } from '@/services/reconciliationServices';
import { bookingChanges } from '@/services/bookingChangeServices';
import axios from '@/api/axios';
import type { ApiResponse } from '@/types/api';

export default function AdminNotifications({ onCount }: { onCount: (count: number, partial: boolean) => void }) {
  const payment = useHasPermission(P.PAYMENT_RECONCILIATION.GET_LIST);
  const changes = useHasPermission(P.BOOKING_CHANGES.READ);
  const integrity = useHasPermission(P.BOOKINGS.GET_ALL);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const allowed = payment || changes || integrity;
  const { data, loading, refresh } = useApiQuery(async () => {
    const [paymentResult, changeResult, reviewResult] = await Promise.allSettled([
      payment ? reconciliationServices.list(0, 'ACTIONABLE', { size: 5 }).then(response => {
        if (response.code !== 1000) throw new Error(response.message);
        return response.result;
      }) : undefined,
      changes ? bookingChanges.pending(0, { customerAction: false }) : undefined,
      integrity ? axios.get<unknown, ApiResponse<{ checkedAt: string; items: { booking_id: number }[] }>>('/booking/operations/integrity').then(response => {
        if (response.code !== 1000) throw new Error(response.message);
        return response.result;
      }) : undefined,
    ]);
    const payments = paymentResult.status === 'fulfilled' ? paymentResult.value : undefined;
    const changeQueue = changeResult.status === 'fulfilled' ? changeResult.value : undefined;
    const review = reviewResult.status === 'fulfilled' ? reviewResult.value : undefined;
    const flagged = [...new Set(review?.items.map(item => item.booking_id))];
    return {
      count: (payments?.total ?? payments?.items.length ?? 0) + (changeQueue?.total ?? changeQueue?.items.length ?? 0) + flagged.length,
      partial: [paymentResult, changeResult, reviewResult].some(result => result.status === 'rejected')
        || !!(payments?.hasNext && payments.total === undefined) || !!(changeQueue?.hasNext && changeQueue.total === undefined),
      items: [
        ...(payments?.items ?? []).map(row => ({ id: `pay-${row.txn_ref}`, label: `Đối soát đơn #${row.booking_id}`, date: row.created_at,
          to: `/admin/paymentReconciliation?txnRef=${encodeURIComponent(row.txn_ref)}` })),
        ...(changeQueue?.items ?? []).map(row => ({ id: `change-${row.id}`, label: `Dời lịch đơn #${row.booking_id}`, date: row.created_at ?? '',
          to: `/admin/managerTour/tourDeparture?tourId=${row.tour_id}&requestId=${row.id}` })),
        ...flagged.map(id => ({ id: `review-${id}`, label: `Rà soát đơn #${id}`, date: review?.checkedAt ?? '', to: '/admin/inbox?tab=integrity' })),
      ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    };
  }, { enabled: allowed, deps: [pathname, payment, changes, integrity] });

  useEffect(() => {
    if (data) onCount(data.count, data.partial);
  }, [data, onCount]);
  if (!allowed) return null;
  return <Popover trigger="click" open={open} onOpenChange={value => {
    setOpen(value);
    if (value) void refresh();
  }} title="Việc cần xử lý" content={<Space direction="vertical" size="small">
    {loading && !data && <Spin size="small" />}
    {data?.partial && <span>Chưa tải đủ số liệu.</span>}
    {data?.items.map(item => <Link key={item.id} to={item.to} onClick={() => setOpen(false)}>{item.label}</Link>)}
    {data && !data.partial && !data.items.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có việc cần xử lý" />}
    <Link to="/admin/inbox" onClick={() => setOpen(false)}>Mở hộp công việc</Link>
  </Space>}>
    <Badge offset={[-2, 2]} count={data?.count || (data?.partial ? '!' : 0)} color="#176258">
      <Button icon={<BellOutlined />} aria-label="Thông báo việc cần xử lý" title="Thông báo việc cần xử lý" />
    </Badge>
  </Popover>;
}

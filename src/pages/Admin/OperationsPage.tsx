import AdminInbox from './AdminInbox';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatAdminDatetime as formatDatetime } from '@/components/Admin/Shared/adminDate';
import { ArrowRight, CreditCard, CalendarClock } from 'lucide-react';
import AdminPageHeader from '@/components/Admin/Shared/AdminPageHeader';
import OperationsInsightsPanel, { RecentAudit, Report } from './OperationsInsightsPanel';
import type { ReactNode } from 'react';
import { Alert, Button, Card, Empty, Progress, Skeleton, Space, Tag, Tooltip } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { useApiQuery } from '@/hooks';
import { bookingChanges } from '@/services/bookingChangeServices';
import { reconciliationServices } from '@/services/reconciliationServices';
import { getUpcomingDepartures } from '@/services/tourServices';
import { formatCurrencyVND, formatDate } from '@/utils';

type OperationsPageData<T> = { items: T[]; hasNext: boolean };

function WorkSection<T>({ title, emptyText, fetchPage, renderRow, allHref }: {
  title: string;
  allHref?: string;
  emptyText: string;
  fetchPage: () => Promise<OperationsPageData<T>>;
  renderRow: (row: T) => { id: string | number; link: string; label: ReactNode; detail: ReactNode; status: ReactNode; departureDate?: string };
}) {
  const { data, loading, error, refresh } = useApiQuery(fetchPage);

  return <Card title={title} className="min-w-0" extra={<Space>
    {allHref && <Link to={allHref}>Xem tất cả</Link>}
    <Tooltip title="Làm mới"><Button size="small" aria-label="Làm mới" icon={<ReloadOutlined />} loading={loading} onClick={() => void refresh()} /></Tooltip>
  </Space>}>
    {loading ? <Skeleton active title={false} paragraph={{ rows: 3 }} /> : error
      ? <Alert type="warning" showIcon message="Chưa tải được danh sách" description={error} />
      : data?.items.length ? <ul className="m-0 list-none divide-y divide-slate-100 p-0">
        {data.items.map(row => {
          const item = renderRow(row);
          return <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0">
            {item.departureDate && <time className="admin-date-block" dateTime={item.departureDate}>
              <b>{formatDate(item.departureDate).split('/')[0]}</b><span>Thg {formatDate(item.departureDate).split('/')[1]}</span>
            </time>}
            <div className="min-w-0 flex-1">
              <Link to={item.link} className="break-words font-semibold">{item.label}</Link>
              <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
            </div>
            {item.status}
          </li>;
        })}
      </ul> : data && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />}
  </Card>;
}

function PriorityQueue({ payments, changes }: { payments: boolean; changes: boolean }) {
  const { data, loading, error } = useApiQuery(async () => {
    const [paymentPage, changePage] = await Promise.allSettled([
      payments ? reconciliationServices.list(0, 'ACTIONABLE', { size: 3 }) : undefined,
      changes ? bookingChanges.pending(0, { customerAction: false }) : undefined,
    ]);
    const items = [
      ...(paymentPage.status === 'fulfilled' && paymentPage.value?.code === 1000
        ? paymentPage.value.result.items.map(row => ({
          key: row.txn_ref, icon: CreditCard, label: `Đối soát đơn #${row.booking_id}`, context: formatCurrencyVND(Number(row.amount_vnd)),
          path: `/admin/paymentReconciliation?txnRef=${encodeURIComponent(row.txn_ref)}`,
        })) : []),
      ...(changePage.status === 'fulfilled' && changePage.value
        ? changePage.value.items.slice(0, 3).map(row => ({
          key: String(row.id), icon: CalendarClock, label: `Dời lịch đơn #${row.booking_id}`, context: row.tour_title,
          path: `/admin/managerTour/tourDeparture?tourId=${row.tour_id}&requestId=${row.id}`,
        })) : []),
    ];
    const paymentData = paymentPage.status === 'fulfilled' && paymentPage.value?.code === 1000 ? paymentPage.value.result : undefined;
    const changeData = changePage.status === 'fulfilled' ? changePage.value : undefined;
    const totals = [
      ...(payments ? [{ key: 'PAYMENT', label: 'Đối soát chờ xử lý', count: paymentData ? String(paymentData.total ?? paymentData.items.length) : '—' }] : []),
      ...(changes ? [{ key: 'CHANGE', label: 'Yêu cầu dời lịch chờ duyệt', count: changeData ? String(changeData.total ?? changeData.items.length) : '—' }] : []),
    ];
    return { items, totals, partial: paymentPage.status === 'rejected' || changePage.status === 'rejected'
      || (paymentPage.status === 'fulfilled' && !!paymentPage.value && paymentPage.value.code !== 1000) };
  }, { deps: [payments, changes] });
  if (!loading && !error && data && !data.partial && data.items.length === 0
    && data.totals.every(item => Number(item.count) === 0)) {
    return <div className="admin-action-empty">
      <Space><CheckCircleOutlined aria-hidden />Không có việc cần xử lý</Space>
      <Link to="/admin/inbox">Mở hộp công việc</Link>
    </div>;
  }
  return <Card size="small" className="admin-action-panel" title="Cần xử lý" extra={<Link to="/admin/inbox">Mở hộp công việc</Link>}>
    {loading ? <Skeleton active title={false} paragraph={{ rows: 3 }} /> : <>
      {(error || data?.partial) && <Alert type="warning" showIcon message="Một số công việc chưa tải được." />}
      {!error && data && !data.partial && !data.items.length && data.totals.every(item => Number(item.count) === 0) && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có việc cần xử lý" />}
      {(data && (data.totals.some(item => Number(item.count) > 0) || data.items.length || data.partial)) ? <div className="admin-inbox-summary">{data.totals.map(item => {
        const Icon = item.key === 'PAYMENT' ? CreditCard : CalendarClock;
        const examples = data.items.filter(example => example.icon === Icon);
        return <Tooltip key={item.key} title={examples.length ? examples.map(example => <div key={example.key}>{example.label} · {example.context}</div>) : undefined}>
          <Link to={`/admin/inbox?category=${item.key}`}>
            <span className="admin-case-icon"><Icon size={18} aria-hidden="true" /></span>
            <span>{item.label}</span><strong>{item.count}</strong><ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Tooltip>;
      })}</div> : null}
    </>}
  </Card>;
}

export default function OperationsPage() {
  const { pathname } = useLocation();
  const view = pathname === '/admin/audit' ? 'audit' : pathname === '/admin/inbox' ? 'inbox' : 'dashboard';
  const canSeeBookings = useHasPermission(P.BOOKINGS.GET_ALL);
  const canSeeInvoices = useHasPermission(P.INVOICES.GET_ALL);
  const admin = useHasPermission({ code: 'SGU_SUPER_ADMIN' });
  const canReconcile = useHasPermission(P.PAYMENT_RECONCILIATION.GET_LIST);
  const canSeeDepartures = useHasPermission(P.TOUR_DEPARTURES.GET_LIST);
  const canSeeChanges = useHasPermission(P.BOOKING_CHANGES.READ);
  const departures = canSeeDepartures && view === 'dashboard';

  return <div className="admin-dashboard pb-8">
    <AdminPageHeader title={view === 'dashboard' ? 'Tổng quan' : view === 'inbox' ? 'Hộp công việc' : 'Nhật ký quản trị'}
      description={view === 'dashboard' ? 'Theo dõi thu, hoàn tiền và lịch khởi hành.' : view === 'inbox' ? 'Theo dõi đối soát, yêu cầu dời lịch và đơn cần rà soát.' : 'Truy vết thao tác thay đổi dữ liệu của quản trị viên và nhân viên.'} />
    {view === 'dashboard' ? <>
      {(canReconcile || (canSeeChanges && canSeeDepartures)) && <PriorityQueue payments={canReconcile} changes={canSeeChanges && canSeeDepartures} />}
      {canSeeBookings && canSeeInvoices && <Report />}
      {(departures || admin) && <div className="admin-dashboard-lower">
      {departures && <WorkSection title="Khởi hành 7 ngày tới" emptyText="Chưa có lịch khởi hành" allHref="/admin/departures?upcoming=7"
        fetchPage={async () => {
          const result = await getUpcomingDepartures(0);
          if (result.code !== 1000) throw new Error(result.message);
          return { items: result.result.items.slice(0, 5), hasNext: false };
        }}
        renderRow={row => ({
          id: row.id, label: row.tourTitle, departureDate: row.departureDate,
          link: `/admin/tours/${row.tourId}/departures?departureId=${row.id}`,
          detail: formatDatetime(row.departureDate), status: row.capacity != null && row.availableSeats != null
            ? <div className="admin-capacity-score"><span>{Math.max(0, row.capacity - row.availableSeats)} / {row.capacity}</span>
              <Progress size="small" percent={row.capacity > 0 ? Math.max(0, (row.capacity - row.availableSeats) / row.capacity * 100) : 0} showInfo={false} /></div>
            : <Tag>Chưa rõ sức chứa</Tag>,
        })} />}
      {admin && <RecentAudit />}
      </div>}
    </> : view === 'inbox' ? <AdminInbox payment={canReconcile} changes={canSeeChanges && canSeeDepartures} integrity={canSeeBookings} />
      : <Card><OperationsInsightsPanel /></Card>}
  </div>;
}

import OperationsInsightsPanel from './OperationsInsightsPanel';
import { useState, type ReactNode } from 'react';
import { Alert, Button, Card, DatePicker, Empty, InputNumber, Select, Skeleton, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';
import { useApiQuery } from '@/hooks';
import { bookingChanges } from '@/services/bookingChangeServices';
import { reconciliationServices } from '@/services/reconciliationServices';
import { getUpcomingDepartures } from '@/services/tourServices';
import { formatCurrencyVND, formatDatetime } from '@/utils';

type OperationsPageData<T> = { items: T[]; hasNext: boolean };

function WorkSection<T>({ title, emptyText, fetchPage, renderRow }: {
  title: string;
  emptyText: string;
  fetchPage: (page: number) => Promise<OperationsPageData<T>>;
  renderRow: (row: T) => { id: string | number; link: string; label: ReactNode; detail: ReactNode; status: ReactNode };
}) {
  const [page, setPage] = useState(0);
  const { data, loading, error, refresh } = useApiQuery(() => fetchPage(page), { deps: [page] });

  return <Card title={title} className="min-w-0" extra={<Button size="small" onClick={() => void refresh()} loading={loading}>
    Cập nhật
  </Button>}>
    {loading ? <Skeleton active title={false} paragraph={{ rows: 3 }} /> : error
      ? <Alert type="warning" showIcon message="Chưa tải được danh sách" description={error} />
      : data?.items.length ? <ul className="divide-y divide-slate-100">
        {data.items.map(row => {
          const item = renderRow(row);
          return <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0">
            <div className="min-w-0">
              <Link to={item.link} className="break-words font-semibold">{item.label}</Link>
              <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
            </div>
            {item.status}
          </li>;
        })}
      </ul> : data && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />}
    {(page > 0 || data?.hasNext) && <div className="mt-3 flex items-center gap-2">
      <Button size="small" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Trang trước</Button>
      <span>Trang {page + 1}</span>
      <Button size="small" disabled={!data?.hasNext || loading} onClick={() => setPage(page + 1)}>Trang sau</Button>
    </div>}
  </Card>;
}

export default function OperationsPage() {
  const [category, setCategory] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [day, setDay] = useState<string>();
  const [input, setInput] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<number>();
  const canSeeBookings = useHasPermission(P.BOOKINGS.GET_ALL);
  const canSeeInvoices = useHasPermission(P.INVOICES.GET_ALL);
  const admin = useHasPermission({ code: 'SGU_SUPER_ADMIN' });
  const canReconcile = useHasPermission(P.PAYMENT_RECONCILIATION.GET_LIST);
  const canSeeDepartures = useHasPermission(P.TOUR_DEPARTURES.GET_LIST);
  const canSeeChanges = useHasPermission(P.BOOKING_CHANGES.READ);

  const payment = canReconcile && ['ALL', 'PAYMENT'].includes(category) && action !== 'CUSTOMER';
  const changes = canSeeDepartures && canSeeChanges && ['ALL', 'CHANGE'].includes(category);
  const departures = canSeeDepartures && ['ALL', 'DEPARTURE'].includes(category) && action !== 'CUSTOMER' && !bookingId;
  const scope = `${day ?? ''}:${action}:${bookingId ?? ''}`;
  const search = () => setBookingId(input && Number.isInteger(input) && input > 0 ? input : undefined);

  return <div>
    <Typography.Title level={3}>Việc cần xử lý</Typography.Title>
    {(canReconcile || canSeeDepartures) && <Space direction="vertical" size="small" className="mb-4">
      <Space wrap>
        <Select aria-label="Loại công việc" value={category} onChange={setCategory} options={[
          { value: 'ALL', label: 'Tất cả công việc' },
          ...(canReconcile ? [{ value: 'PAYMENT', label: 'Đối soát' }] : []),
          ...(canSeeChanges && canSeeDepartures ? [{ value: 'CHANGE', label: 'Dời lịch' }] : []),
          ...(canSeeDepartures ? [{ value: 'DEPARTURE', label: 'Lịch khởi hành' }] : []),
        ]} />
        <Select aria-label="Người cần xử lý tiếp" value={action} onChange={setAction} options={[
          { value: 'ALL', label: 'Tất cả người xử lý' }, { value: 'STAFF', label: 'Nhân viên xử lý' },
          { value: 'CUSTOMER', label: 'Chờ khách phản hồi' },
        ]} />
        <DatePicker aria-label="Ngày nghiệp vụ" format="DD/MM/YYYY" onChange={value => setDay(value?.format('YYYY-MM-DD'))} />
        <InputNumber aria-label="Mã đơn đặt tour" placeholder="Mã đơn" min={1} max={2147483647} precision={0}
          value={input} onChange={value => { setInput(value); if (value == null) setBookingId(undefined); }} onPressEnter={search} />
        <Button onClick={search}>Lọc theo mã đơn</Button>
        {bookingId && canSeeBookings && <Link to={`/admin/managerBooking?bookingId=${bookingId}`}>Xem đơn #{bookingId}</Link>}
      </Space>
      {day && <Typography.Text type="secondary">Ngày tạo giao dịch hoặc ngày khởi hành của lịch gốc, theo giờ Việt Nam.</Typography.Text>}
    </Space>}
    {!payment && !changes && !departures && (canReconcile || canSeeDepartures) &&
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có nhóm công việc phù hợp với các bộ lọc này" />}
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {payment && <WorkSection key={`payment:${scope}`} title="Đối soát thanh toán" emptyText="Không có giao dịch cần đối soát"
        fetchPage={async page => {
          const response = await reconciliationServices.list(page, 'ACTIONABLE', { size: 5, bookingId, day });
          if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được giao dịch');
          return response.result;
        }}
        renderRow={row => ({
          id: `${row.provider}-${row.txn_ref}`,
          link: `/admin/paymentReconciliation?txnRef=${encodeURIComponent(row.txn_ref)}`,
          label: `Đối soát đơn #${row.booking_id}`,
          detail: `${row.provider === 'VNPAY' ? 'VNPAY' : 'MoMo'} · ${formatCurrencyVND(Number(row.amount_vnd))} · ${formatDatetime(row.created_at)}`,
          status: <Tag color="orange">{row.case_status === 'OPEN' ? 'Ưu tiên đối chiếu' : 'Nhân viên đối soát'}</Tag>,
        })} />}
      {changes && <WorkSection key={`changes:${scope}`} title="Yêu cầu dời lịch" emptyText="Không có yêu cầu đang chờ"
        fetchPage={page => bookingChanges.pending(page, {
          bookingId, day, customerAction: action === 'ALL' ? undefined : action === 'CUSTOMER',
        })}
        renderRow={row => ({
          id: row.id,
          link: `/admin/managerTour/tourDeparture?tourId=${row.tour_id}&requestId=${row.id}`,
          label: `Yêu cầu #${row.id} · đơn #${row.booking_id}`,
          detail: `${row.tour_title} · ${formatDatetime(row.source_departure_at)}`,
          status: <Tag color="gold">{row.status === 'SUPPORT_REQUIRED' ? 'Cần hỗ trợ'
            : row.status === 'ACCEPTED' ? 'Chờ chuyển lịch' : row.kind === 'CUSTOMER' ? 'Chờ duyệt' : 'Chờ khách phản hồi'}</Tag>,
        })} />}
      {departures && <WorkSection key={`departure:${scope}`} title="Khởi hành trong 7 ngày tới" emptyText="Không có lịch mở trong 7 ngày tới"
        fetchPage={async page => {
          const response = await getUpcomingDepartures(page, day);
          if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được lịch khởi hành');
          return response.result;
        }}
        renderRow={row => ({
          id: row.id,
          link: `/admin/managerTour/tourDeparture?tourId=${row.tourId}&departureId=${row.id}`,
          label: row.tourTitle,
          detail: `${row.tourCode} · ${formatDatetime(row.departureDate)}`,
          status: <Tag>{row.availableSeats == null ? 'Chưa rõ số chỗ' : row.availableSeats > 0
            ? `Còn ${row.availableSeats} chỗ` : 'Hết chỗ'}</Tag>,
        })} />}
    </div>
    <OperationsInsightsPanel bookings={canSeeBookings} invoices={canSeeInvoices} admin={admin} />
  </div>;
}

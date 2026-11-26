import RowActions from '@/components/Admin/Shared/RowActions';
import AdminPagination from '@/components/Admin/Shared/AdminPagination';
import { useAdminPagination } from '@/components/Admin/Shared/useAdminPagination';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { AdminTable as Table } from '@/components/Admin/Shared/AdminTable';
import { CalendarClock, Clock3, RotateCcw, Ticket, Wallet } from 'lucide-react';
import ReportTrend from './ReportTrend';
import { useState, type ReactNode } from 'react';
import { Alert, Button, Card, DatePicker, Descriptions, Drawer, Empty, InputNumber, Modal, Select, Skeleton, Space, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';
import { useApiQuery } from '@/hooks';
import { formatCurrencyVND, formatDatetime } from '@/utils';
import { errorMessage } from '@/utils/errors';

const endpoint = '/booking/operations';
const bookingPath = (id: number) => `/admin/managerBooking?bookingId=${id}`;
const date = (value?: string) => value ? formatDatetime(value) : '—';

async function read<T>(path: string, params?: object): Promise<T> {
  const response: ApiResponse<T> = await axiosClient.get(endpoint + path, { params });
  if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được dữ liệu');
  return response.result;
}

const reportMetrics = [
  { key: 'bookings', label: 'Đơn tạo trong kỳ' },
  { key: 'expired', label: 'Đơn hết hạn trong nhóm đơn tạo' },
  { key: 'completed', label: 'Đơn đã trả tiền, chuyến đã kết thúc' },
  { key: 'collected', label: 'Tiền đã thu theo ngày thanh toán', money: true },
  { key: 'schedule_refunds', label: 'Hoàn tiền theo hồ sơ dời lịch', money: true },
  { key: 'reconciliation_refunds', label: 'Hoàn tiền theo hồ sơ đối soát', money: true },
  { key: 'confirmed_passengers', label: 'Khách xác nhận theo ngày khởi hành' },
] as const;

type ReportMetric = typeof reportMetrics[number]['key'];
type ReportPoint = Record<ReportMetric, number> & { period: string };
type ReportData = Record<ReportMetric, number> & {
  series: ReportPoint[];
  granularity: 'DAY' | 'MONTH';
  tours: { id: number; title: string; region: string }[];
};
type ReportQuery = { from: string; through: string; tourId?: number; region?: string };
const regions = [
  { value: 'NORTH', label: 'Miền Bắc' },
  { value: 'CENTRAL', label: 'Miền Trung' },
  { value: 'SOUTH', label: 'Miền Nam' },
  { value: 'UNKNOWN', label: 'Chưa phân miền' },
];

function initialReportQuery(): ReportQuery {
  const today = dayjs(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  return { from: today.startOf('month').format('YYYY-MM-DD'), through: today.format('YYYY-MM-DD') };
}

function metricValue(metric: ReportMetric, value: number) {
  return ['collected', 'schedule_refunds', 'reconciliation_refunds'].includes(metric)
    ? formatCurrencyVND(value) : Number(value).toLocaleString('vi-VN');
}

const headlineMetrics = [
  { key: 'bookings', label: 'Đơn tạo trong kỳ', icon: Ticket, tone: 'blue', detail: 'Theo ngày tạo đơn' },
  { key: 'collected', label: 'Tiền đã thu', icon: Wallet, tone: 'teal', detail: 'Theo ngày thanh toán' },
  { key: 'expired', label: 'Tỷ lệ hết hạn', icon: Clock3, tone: 'amber', detail: 'Trong nhóm đơn tạo trong kỳ' },
  { key: 'confirmed_passengers', label: 'Khách xác nhận', icon: CalendarClock, tone: 'violet', detail: 'Theo ngày khởi hành' },
] as const;


export function Report({ priority }: { priority?: ReactNode }) {
  const [query, setQuery] = useState(initialReportQuery);
  const [draft, setDraft] = useState(query);
  const [metric, setMetric] = useState<ReportMetric>('collected');
  const { data, loading, error } = useApiQuery(() => read<ReportData>('/report', query), { deps: [query] });
  const dayCount = dayjs(query.through).diff(dayjs(query.from), 'day') + 1;
  const prior = { ...query, from: dayjs(query.from).subtract(dayCount, 'day').format('YYYY-MM-DD'),
    through: dayjs(query.from).subtract(1, 'day').format('YYYY-MM-DD') };
  const { data: previous } = useApiQuery(() => read<ReportData>('/report', prior), { deps: [query] });
  const tours = data?.tours ?? [];
  const valid = !!draft.from && !!draft.through && draft.through >= draft.from
    && !dayjs(draft.through).isAfter(dayjs(draft.from).add(1, 'year').subtract(1, 'day'), 'day');
  const points = data?.series ?? [];


  function download() {
    if (!data) return;
    const lines = [
      ['Kỳ', ...reportMetrics.map(item => item.label)].join(','),
      [`${query.from} đến ${query.through}`, ...reportMetrics.map(item => data[item.key])].join(','),
      ...points.map(point => [point.period, ...reportMetrics.map(item => point[item.key])].join(',')),
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sgu-tour-${query.from}-${query.through}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const apply = (next: ReportQuery) => { setDraft(next); setQuery(next); };
  const today = dayjs(initialReportQuery().through);
  return <div className="admin-report">
    <Card size="small" className="admin-filter-card"><div className="admin-report-filters">
      {[
        { label: 'Hôm nay', from: today }, { label: '7 ngày', from: today.subtract(6, 'day') },
        { label: '30 ngày', from: today.subtract(29, 'day') }, { label: 'Tháng này', from: today.startOf('month') },
      ].map(item => <Button key={item.label} onClick={() => apply({ ...draft, from: item.from.format('YYYY-MM-DD'), through: today.format('YYYY-MM-DD') })}>{item.label}</Button>)}
      <DatePicker.RangePicker aria-label="Kỳ báo cáo" format="DD/MM/YYYY" allowClear={false}
        value={[dayjs(draft.from), dayjs(draft.through)]} onChange={range => {
          if (range?.[0] && range[1] && !range[1].isAfter(range[0].add(1, 'year').subtract(1, 'day'), 'day')) {
            apply({ ...draft, from: range[0].format('YYYY-MM-DD'), through: range[1].format('YYYY-MM-DD') });
          } else if (range?.[0] && range[1]) message.warning('Kỳ báo cáo tối đa một năm.');
        }} />
      <Select aria-label="Miền điểm đến" allowClear placeholder="Tất cả miền" value={draft.region} options={regions}
        onChange={region => apply({ ...draft, region, tourId: undefined })} />
      <Select aria-label="Tour báo cáo" showSearch optionFilterProp="label" allowClear placeholder="Tất cả tour" value={draft.tourId}
        onChange={tourId => apply({ ...draft, tourId })}
        options={tours.filter(tour => !draft.region || draft.region === tour.region).map(tour => ({ value: tour.id, label: tour.title }))} />
      <Button disabled={!data || loading || !!error} onClick={download}>Xuất CSV</Button>
    </div></Card>
    {!valid && <Alert type="warning" message="Chọn kỳ hợp lệ, tối đa một năm theo lịch." />}
    {error && <Alert type="error" showIcon message={error} />}
    {loading && <Skeleton active paragraph={{ rows: 6 }} />}
    {data && !loading && !error && <>
      <div className="admin-kpi-grid">
        {headlineMetrics.map(({ key, label, icon: Icon, tone, detail }) => <article className="admin-kpi" data-tone={tone} key={key}>
          <div className="admin-kpi-header"><span className="admin-metric-icon"><Icon size={19} aria-hidden="true" /></span><h2>{label}</h2><Tooltip title={detail}><span tabIndex={0} aria-label={detail}><InfoCircleOutlined /></span></Tooltip></div>
          <strong>{key === 'expired' ? (data.bookings ? `${(100 * data.expired / data.bookings).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : '—') : metricValue(key, data[key])}</strong>
          {previous && previous[key] > 0 && (key !== 'expired' || (previous.bookings > 0 && data.bookings > 0)) && (() => {
            const before = key === 'expired' ? previous.expired / previous.bookings : previous[key];
            const after = key === 'expired' ? data.expired / data.bookings : data[key];
            const delta = 100 * (after - before) / before;
            if (!delta) return null;
            return <Tooltip title={`So với ${dayjs(prior.from).format('DD/MM/YYYY')} – ${dayjs(prior.through).format('DD/MM/YYYY')}`}>
              <span className={key === 'expired' ? (delta < 0 ? 'text-green-800' : 'text-red-800') : (delta > 0 ? 'text-green-800' : 'text-red-800')}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
              </span>
            </Tooltip>;
          })()}
        </article>)}
        <article className="admin-kpi" data-tone="teal">
          <div className="admin-kpi-header"><span className="admin-metric-icon"><RotateCcw size={19} /></span><h2>Hoàn tiền</h2>
            <Tooltip title={`Dời lịch ${formatCurrencyVND(data.schedule_refunds)} · Đối soát ${formatCurrencyVND(data.reconciliation_refunds)}`}>
              <span tabIndex={0} aria-label="Chi tiết hoàn tiền"><InfoCircleOutlined /></span>
            </Tooltip></div>
          <strong>{formatCurrencyVND(Number(data.schedule_refunds) + Number(data.reconciliation_refunds))}</strong>
        </article>
      </div>
      <div className={priority ? 'admin-analysis' : undefined}>
        <ReportTrend points={points.map(point => ({ period: point.period, value: point[metric] }))}
          monthly={data.granularity === 'MONTH'} metric={metric} onMetricChange={setMetric}
          options={[{ value: 'collected', label: 'Tiền thu' }, { value: 'bookings', label: 'Số đơn' }]}
          format={value => metricValue(metric, value)} />
        {priority}
      </div>
    </>}
  </div>;
}

type Delivery = { id: number; event_type: string; status: string; attempt_count: number; scheduled_at: string; sent_at?: string };
const deliveryLabels: Record<string, string> = {
  PENDING: 'Đang chờ', CLAIMED: 'Đang chuẩn bị gửi', DISPATCHING: 'Đang gửi', UNKNOWN: 'Chưa rõ kết quả', RETRY: 'Chờ gửi lại',
  SENT: 'Đã gửi', FAILED: 'Gửi thất bại', CANCELLED: 'Đã hủy', SKIPPED: 'Đã bỏ qua',
};
const eventLabels: Record<string, string> = {
  PAYMENT_SUCCEEDED: 'Xác nhận thanh toán', PAYMENT_REMINDER_1: 'Nhắc thanh toán lần 1',
  PAYMENT_REMINDER_2: 'Nhắc thanh toán lần 2', BOOKING_EXPIRED: 'Giữ chỗ hết hạn',
  BOOKING_CANCELLED: 'Hủy đơn', HOLD_CREATED: 'Xác nhận giữ chỗ', BOOKING_CHANGED: 'Cập nhật lịch',
};

export function Deliveries({ admin, initialBookingId }: { admin: boolean; initialBookingId?: number }) {
  const [params] = useSearchParams();
  const initialId = initialBookingId ?? (Number(params.get('bookingId')) || undefined);
  const [id, setId] = useState<number | null>(initialId ?? null);
  const [bookingId, setBookingId] = useState(initialId);
  const [selected, setSelected] = useState<Delivery>();
  const [saving, setSaving] = useState(false);
  const { data, loading, error, refresh } = useApiQuery(
    () => read<Delivery[]>(`/deliveries/${bookingId}`), { enabled: !!bookingId, deps: [bookingId] },
  );

  async function retry() {
    if (!bookingId || !selected || saving) return;
    setSaving(true);
    try {
      const response: ApiResponse<boolean> = await axiosClient.post(`${endpoint}/deliveries/${bookingId}/${selected.id}/retry`);
      if (response.code !== 1000) throw new Error(response.message || 'Chưa thể đưa email lại vào hàng đợi');
      setSelected(undefined);
      message.success('Đã đưa email vào hàng đợi');
      await refresh();
    } catch (failure) {
      message.error(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return <Space direction="vertical" className="w-full">
    <Space wrap>
      <InputNumber aria-label="Mã đơn đặt tour" placeholder="Mã đơn" min={1} max={2147483647} precision={0} value={id} onChange={setId}
        onPressEnter={() => { if (id && Number.isInteger(id)) setBookingId(id); }} />
      <Button disabled={!id || !Number.isInteger(id)} loading={loading} onClick={() => {
        if (!id) return;
        if (id === bookingId) void refresh();
        else setBookingId(id);
      }}>Tra cứu email</Button>
      {bookingId && <Link to={bookingPath(bookingId)}>Xem đơn #{bookingId}</Link>}
    </Space>
    {error && <Alert type="error" showIcon message={error} />}
    {!bookingId && <div className="admin-empty-panel"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Nhập mã đơn để xem lịch gửi, kết quả và số lần thử của từng email." /></div>}
    {bookingId && !error && <Table size="small" rowKey="id" dataSource={loading ? undefined : data} loading={loading}
      pagination={false} scroll={{ x: 620 }} columns={[
        { title: 'Loại email', dataIndex: 'event_type', render: (value: string) => eventLabels[value] || value },
        { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <Tag>{deliveryLabels[value] || value}</Tag> },
        { title: 'Số lần thử', dataIndex: 'attempt_count' },
        { title: 'Lịch gửi', dataIndex: 'scheduled_at', render: date },
        { title: 'Đã gửi lúc', dataIndex: 'sent_at', render: date },
        ...(admin ? [{ title: 'Thao tác', render: (_: unknown, row: Delivery) => row.status === 'FAILED' && !row.sent_at &&
          <Button size="small" onClick={() => setSelected(row)}>Đưa vào hàng đợi</Button> }] : []),
      ]} />}
    <Modal title="Đưa email thất bại vào hàng đợi" open={!!selected} onOk={() => void retry()}
      onCancel={() => { if (!saving) setSelected(undefined); }} confirmLoading={saving} okText="Xác nhận" cancelText="Đóng">
      Hệ thống sẽ gửi lại theo lịch xử lý hàng đợi email.
    </Modal>
  </Space>;
}

type AuditRow = {
  id: number;
  entityType: string;
  entityId: string;
  actorId?: string;
  action?: string;
  detail?: unknown;
  beforeValue?: string;
  afterValue?: string;
  occurredAt: string;
};

const auditLabels: Record<string, string> = {
  CAPACITY: 'Sức chứa / lịch', MEETING_POINT: 'Điểm tập trung', PRICE: 'Bảng giá',
  ROLE: 'Vai trò', MAIL_RETRY: 'Gửi lại email', BOOKING: 'Đặt chỗ', PAYMENT: 'Thanh toán',
  INVOICE: 'Hóa đơn', TOUR: 'Tour', USER: 'Tài khoản',
};

function auditDetail(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

const auditActions: Record<string, string> = {
  'payment.settled.v1': 'Thanh toán thành công',
  'payment.reconciled.v1': 'Ghi nhận đối soát',
};
const auditTime = (value?: string) => value ? date(value).replace(/^(\d\d:\d\d:\d\d) (.+)$/, '$2 · $1') : '—';

function Audit() {
  const [selected, setSelected] = useState<AuditRow>();
  const { page, size, mode, change, tableRef } = useAdminPagination();
  const { data, loading, error, refresh } = useApiQuery(() => read<{ items: AuditRow[]; total: number }>('/audit', { page: page - 1, size }), { deps: [page, size] });
  return <div ref={tableRef} className="admin-inbox-body">
    {error && <Alert type="error" showIcon message={error} action={<Button onClick={() => void refresh()}>Thử lại</Button>} />}
    <Table size="small" rowKey="id" loading={loading} dataSource={loading || error ? undefined : data?.items}
      pagination={false} locale={{ emptyText: <Empty description="Chưa có thao tác trong nhật ký" /> }}
      columns={[
        { title: 'Thời gian', dataIndex: 'occurredAt', render: auditTime },
        { title: 'Người thực hiện', render: (_, row) => row.actorId ? `Tài khoản #${row.actorId}` : 'Hệ thống' },
        { title: 'Hành động', render: (_, row) => row.action ? <Tooltip title={row.action}>{auditActions[row.action] || 'Cập nhật'}</Tooltip> : 'Cập nhật' },
        { title: 'Đối tượng', render: (_, row) => {
          const kind = row.entityType.toUpperCase();
          const text = `${auditLabels[kind] || row.entityType} #${row.entityId}`;
          return kind === 'BOOKING' ? <Link to={bookingPath(Number(row.entityId))}>{text}</Link>
            : kind === 'TOUR' ? <Link to={`/admin/tours/${row.entityId}`}>{text}</Link> : text;
        } },
        { title: 'Thao tác', render: (_, row) => <RowActions subject={`sự kiện #${row.id}`} onDetails={() => setSelected(row)} /> },
      ]} />
    {data && <AdminPagination mode={mode} page={page} size={size} total={data.total} onChange={change} />}
    <Drawer title={`Chi tiết thao tác #${selected?.id ?? ''}`} open={!!selected} width={640} onClose={() => setSelected(undefined)}>
      {selected && <div className="admin-inbox-body"><Descriptions column={1} bordered size="small" items={[
        { label: 'Thời gian', children: auditTime(selected.occurredAt) },
        { label: 'Mã hành động', children: selected.action || '—' },
        { label: 'Trước', children: selected.beforeValue || '—' },
        { label: 'Sau', children: selected.afterValue || '—' },
      ]} />{selected.detail != null && <details><summary>Dữ liệu chi tiết</summary>
        <pre className="whitespace-pre-wrap break-all">{auditDetail(selected.detail)}</pre></details>}</div>}
    </Drawer>
  </div>;
}

export function RecentAudit() {
  const { data, loading, error } = useApiQuery(() => read<{ items: AuditRow[] }>('/audit', { page: 0, size: 8 }));
  return <Card title="Hoạt động gần đây" extra={<Link to="/admin/audit?tab=audit">Xem tất cả</Link>}>
    {loading ? <Skeleton active /> : error ? <Alert type="warning" message={error} />
      : data?.items.length ? <ul className="admin-recent-audit">{data.items.slice(0, 8).map(row => <li key={row.id}>
        <strong>{auditLabels[row.entityType] || row.entityType} #{row.entityId}</strong>
        <span>{row.action || 'Cập nhật'} · {date(row.occurredAt)}</span>
      </li>)}</ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hoạt động" />}
  </Card>;
}

export default function OperationsInsightsPanel({ bookings, admin }: { bookings: boolean; admin: boolean }) {
  const [params] = useSearchParams();
  return <Tabs defaultActiveKey={bookings && params.get('tab') === 'mail' ? 'mail' : admin ? 'audit' : 'mail'} className="admin-operations-tabs" items={[
    ...(admin ? [{ key: 'audit', label: 'Nhật ký thao tác', children: <Audit /> }] : []),
    ...(bookings ? [{ key: 'mail', label: 'Email theo đơn', children: <Deliveries admin={admin} /> }] : []),
  ]} />;
}

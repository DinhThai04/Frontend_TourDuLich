import AdminPagination from '@/components/Admin/Shared/AdminPagination';
import { useAdminPagination } from '@/components/Admin/Shared/useAdminPagination';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { AdminTable as Table } from '@/components/Admin/Shared/AdminTable';
import { CalendarClock, Clock3, RotateCcw, Ticket, Wallet } from 'lucide-react';
import ReportTrend from './ReportTrend';
import { useState, type ReactNode } from 'react';
import { Alert, Button, Card, DatePicker, Descriptions, Drawer, Empty, Input, Select, Skeleton, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import axiosClient from '@/api/axios';
import type { ApiResponse } from '@/types/comment';
import { useApiQuery } from '@/hooks';
import { formatCurrencyVND } from '@/utils';

const endpoint = '/booking/operations';
const bookingPath = (id: number) => `/admin/managerBooking?bookingId=${id}&detail=1`;

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
  const [chosenPreset, setChosenPreset] = useState('Tháng này');
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
  const todayKey = today.format('YYYY-MM-DD');
  const presets = [
    { label: 'Hôm nay', from: today }, { label: '7 ngày', from: today.subtract(6, 'day') },
    { label: '30 ngày', from: today.subtract(29, 'day') }, { label: 'Tháng này', from: today.startOf('month') },
  ].map(item => ({ label: item.label, from: item.from.format('YYYY-MM-DD') }));
  const matches = presets.filter(item => item.from === draft.from && draft.through === todayKey);
  const activePreset = matches.find(item => item.label === chosenPreset)?.label ?? matches[0]?.label;
  return <div className="admin-report">
    <Card size="small" className="admin-filter-card"><div className="admin-report-filters">
      {presets.map(item => <Button key={item.label} type={activePreset === item.label ? 'primary' : 'default'}
        aria-pressed={activePreset === item.label} onClick={() => {
          setChosenPreset(item.label);
          apply({ ...draft, from: item.from, through: todayKey });
        }}>{item.label}</Button>)}
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
          <strong title={key === 'collected' ? metricValue(key, data[key]) : undefined}>{key === 'expired' ? (data.bookings ? `${(100 * data.expired / data.bookings).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : '—') : metricValue(key, data[key])}</strong>
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
          <strong title={formatCurrencyVND(Number(data.schedule_refunds) + Number(data.reconciliation_refunds))}>{formatCurrencyVND(Number(data.schedule_refunds) + Number(data.reconciliation_refunds))}</strong>
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

const auditLabels: Record<string, string> = {
  CAPACITY: 'Sức chứa / lịch', MEETING_POINT: 'Điểm tập trung', PRICE: 'Bảng giá',
  ROLE: 'Vai trò', MAIL_RETRY: 'Gửi lại email', BOOKING: 'Đặt chỗ', PAYMENT: 'Thanh toán',
  INVOICE: 'Hóa đơn', TOUR: 'Tour', USER: 'Tài khoản',
};

const auditActions: Record<string, string> = {
  RECONCILIATION_RECORDED: 'Ghi nhận kết quả đối soát', REFUND_CONFIRMED: 'Ghi nhận khoản hoàn',
  PRICE_UPDATED: 'Cập nhật giá', GUIDE_ASSIGNED: 'Phân công hướng dẫn viên',
  GUIDE_UNASSIGNED: 'Gỡ phân công', DEPARTURE_COMPLETED: 'Chốt chuyến', DEPARTURE_CANCELLED: 'Hủy chuyến',
  ACCOUNT_STATUS_CHANGED: 'Cập nhật trạng thái tài khoản', ROLE_PERMISSION_CHANGED: 'Đổi quyền',
  REVIEW_MODERATED: 'Duyệt đánh giá', GUIDE_CONFLICT_OVERRIDDEN: 'Phân công trùng lịch',
  DEPARTURE_FORCE_COMPLETED: 'Chốt chuyến ngoại lệ', TRIP_REPORT_REVIEWED: 'Xử lý báo cáo chuyến',
  BOOKING_RESCHEDULED: 'Chuyển lịch đặt chỗ', BOOKING_REFUND_RECORDED: 'Ghi nhận khoản hoàn',
  ACCOUNT_LOCK: 'Khóa tài khoản', ACCOUNT_UNLOCK: 'Mở khóa tài khoản', ACCOUNT_ARCHIVE: 'Lưu trữ tài khoản',
  ACCOUNT_DELETE: 'Xóa tài khoản', PERMISSION_UPDATED: 'Cập nhật quyền',
  TOUR_DELETED: 'Xóa tour', DEPARTURE_DELETED: 'Xóa lịch khởi hành',
};
type AdminAuditRow = {
  id: number; actionCode: string; targetType: string; targetId: string; actorId?: string;
  actorType?: string; actorName?: string; actorRole?: string; actionGroup?: string;
  targetLabel?: string; summary?: string; reason?: string; createdAt: string;
  beforeJson?: unknown; afterJson?: unknown; correlationId?: string;
};
const auditEndpoint = '/admin/audit-logs';
const groups = [
  ['FINANCE', 'Tài chính'], ['OPERATIONS', 'Vận hành'], ['ACCOUNT', 'Tài khoản'],
  ['CONTENT', 'Nội dung'], ['SYSTEM_CONFIG', 'Cấu hình hệ thống'],
].map(([value, label]) => ({ value, label }));

async function readAudit<T>(path = '', params?: object): Promise<T> {
  const response: ApiResponse<T> = await axiosClient.get(auditEndpoint + path, { params });
  if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được nhật ký');
  return response.result;
}

function auditTime(row: AdminAuditRow) {
  const value = row.createdAt;
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} · ${get('hour')}:${get('minute')}:${get('second')}`;
}

function auditAction(row: AdminAuditRow) {
  const key = row.actionCode;
  const color = /CANCEL|DELETE|ARCHIVE/.test(key) || key === 'ACCOUNT_LOCK' ? 'red'
    : /RECONCILIATION|REFUND|PRICE|PERMISSION|OVERRIDE|FORCE/.test(key) ? 'orange'
      : /ASSIGN|COMPLETED|MODERATED/.test(key) ? 'green' : 'blue';
  return <Tag color={color}>{auditActions[key] || row.summary || 'Cập nhật dữ liệu'}</Tag>;
}

function snapshot(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try { return snapshot(JSON.parse(value)); } catch { return { 'Giá trị': value }; }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return {};
}

function auditTarget(row: AdminAuditRow) {
  const type = row.targetType.toUpperCase();
  const label = row.targetLabel || `${auditLabels[type] || 'Hồ sơ'} #${row.targetId}`;
  if (!/^\d+$/.test(String(row.targetId)) || row.actionCode.endsWith('_DELETED') || row.actionCode === 'ACCOUNT_DELETE') return label;
  const txnRef = snapshot(row.afterJson).txnRef;
  const paymentFocus = typeof txnRef === 'string'
    ? `txnRef=${encodeURIComponent(txnRef)}&detail=1` : `bookingId=${row.targetId}`;
  const links: Record<string, string> = {
    PAYMENT: `/admin/paymentReconciliation?${paymentFocus}`,
    BOOKING: bookingPath(Number(row.targetId)),
    DEPARTURE: `/admin/departures?departureId=${row.targetId}`,
    TOUR: `/admin/tours/${row.targetId}`,
    ACCOUNT: `/admin/managerUser?userId=${row.targetId}`,
    ROLE: `/admin/authorization?tab=roles&roleId=${row.targetId}`,
    PERMISSION: `/admin/authorization?tab=permissions&permissionId=${row.targetId}`,
    PRICE: `/admin/managerTour/price?priceId=${row.targetId}`,
  };
  const url = links[type];
  return url ? <Link to={url}>{label}</Link> : label;
}

function Audit() {
  const [detailId, setDetailId] = useState<number>();
  const [filters, setFilters] = useState<{ keyword?: string; actorId?: string; actionGroup?: string; fromDate?: string; toDate?: string }>({});
  const { page, size, mode, change, tableRef } = useAdminPagination();
  const { data, loading, error, refresh } = useApiQuery(() => readAudit<{ items: AdminAuditRow[]; total: number }>('', { ...filters, page: page - 1, size }), { deps: [page, size, filters] });
  const detail = useApiQuery(() => readAudit<AdminAuditRow>(`/${detailId}`), { enabled: detailId != null, deps: [detailId] });
  const [actorKeyword, setActorKeyword] = useState('');
  const actorOptions = useApiQuery(async () => {
    const actors = await readAudit<{ actorId: string; actorName: string; actorRole?: string }[]>('/actors', { keyword: actorKeyword });
    return actors.map(actor => ({ value: actor.actorId, label: actor.actorName }));
  }, { deps: [actorKeyword] });
  const update = (patch: Partial<typeof filters>) => { setFilters(current => ({ ...current, ...patch })); change(1); };
  const selected = detail.data?.id === detailId ? detail.data : undefined;
  const before = snapshot(selected?.beforeJson);
  const after = snapshot(selected?.afterJson);
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  const showValue = (value: unknown) => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return <div ref={tableRef} className="admin-inbox-body">
    <Card size="small"><Space wrap>
      <Input.Search aria-label="Tìm nhật ký quản trị" placeholder="Mã đơn, mã chuyến, nội dung..." maxLength={120} allowClear
        onSearch={keyword => update({ keyword: keyword.trim() || undefined })}
        onChange={event => { if (!event.target.value && filters.keyword) update({ keyword: undefined }); }} />
      <Select aria-label="Nhóm hành động" placeholder="Nhóm hành động" style={{ minWidth: 150 }} allowClear options={groups}
        value={filters.actionGroup} onChange={actionGroup => update({ actionGroup })} />
      <Select aria-label="Người thực hiện" placeholder="Người thực hiện" style={{ minWidth: 175 }} allowClear showSearch filterOption={false} onSearch={setActorKeyword}
        loading={actorOptions.loading} options={actorOptions.data ?? []} value={filters.actorId} onChange={actorId => update({ actorId })} />
      <DatePicker.RangePicker aria-label="Khoảng ngày" format="DD/MM/YYYY" onChange={range =>
        update({ fromDate: range?.[0]?.format('YYYY-MM-DD'), toDate: range?.[1]?.format('YYYY-MM-DD') })} />
    </Space></Card>
    {error && <Alert type="error" showIcon message={error} action={<Button onClick={() => void refresh()}>Thử lại</Button>} />}
    <Table<AdminAuditRow> size="small" rowKey="id" loading={loading} dataSource={loading || error ? undefined : data?.items}
      pagination={false} locale={{ emptyText: <Empty description="Chưa có thao tác quản trị phù hợp" /> }}
      columns={[
        { title: 'Thời gian', render: (_, row) => auditTime(row) },
        { title: 'Người thực hiện', render: (_, row) => <Space wrap>{row.actorName || 'Chưa xác định'}
          {row.actorRole && <Tag>{row.actorRole}</Tag>}</Space> },
        { title: 'Hành động', render: (_, row) => auditAction(row) },
        { title: 'Đối tượng', render: (_, row) => auditTarget(row) },
        { title: 'Nội dung / Lý do', render: (_, row) => <span className="block max-w-60 truncate" title={[row.summary, row.reason].filter(Boolean).join(' · ')}>
          {[row.summary, row.reason].filter(Boolean).join(' · ') || '—'}</span> },
        { title: 'Thao tác', render: (_, row) => <Button size="small" onClick={() => setDetailId(row.id)}>Chi tiết</Button> },
      ]} />
    {data && <AdminPagination mode={mode} page={page} size={size} total={data.total} onChange={change} />}
    <Drawer title={`Chi tiết thao tác #${detailId ?? ''}`} open={detailId != null} width="min(660px, 100vw)" onClose={() => setDetailId(undefined)}>
      {detail.loading && <Skeleton active />}
      {detail.error && <Alert type="error" message={detail.error} />}
      {selected && !detail.loading && <>
        <Descriptions column={1} size="small" bordered items={[
          { label: 'Người thực hiện', children: [selected.actorName || selected.actorId, selected.actorRole].filter(Boolean).join(' · ') },
          { label: 'Thời gian', children: auditTime(selected) },
          { label: 'Hành động', children: auditAction(selected) },
          { label: 'Đối tượng', children: auditTarget(selected) },
          { label: 'Lý do', children: selected.reason || '—' },
          { label: 'Correlation ID', children: selected.correlationId || '—' },
        ]} />
        {fields.length > 0 && <Descriptions title="Trước → Sau" className="mt-5" size="small" column={1} bordered
          items={fields.map(key => ({ key, label: ({ status: 'Trạng thái', reconciliationStatus: 'Hồ sơ đối soát', decision: 'Kết quả', amountVnd: 'Số tiền', txnRef: 'Mã giao dịch', reference: 'Tham chiếu', guideAccountId: 'Mã hướng dẫn viên', reportStatus: 'Trạng thái báo cáo', departureId: 'Mã chuyến', permissionIds: 'Mã quyền', roleIds: 'Mã vai trò', adultPrice: 'Giá người lớn', childPrice: 'Giá trẻ em', toddlerPrice: 'Giá trẻ nhỏ', infantPrice: 'Giá em bé', singleSupplementPrice: 'Phụ thu phòng đơn' } as Record<string,string>)[key] || key,
            children: <div className="grid grid-cols-[1fr_auto_1fr] gap-2 break-words"><span>{showValue(before[key])}</span><span>→</span><span>{showValue(after[key])}</span></div> }))} />}
      </>}
    </Drawer>
  </div>;
}

export function RecentAudit() {
  const { data, loading, error } = useApiQuery(() => readAudit<{ items: AdminAuditRow[] }>('', { page: 0, size: 8 }));
  return <Card title="Thao tác quản trị gần đây" extra={<Link to="/admin/audit">Xem tất cả</Link>}>
    {loading ? <Skeleton active /> : error ? <Alert type="warning" message={error} />
      : data?.items.length ? <ul className="admin-recent-audit">{data.items.map(row => <li key={row.id}>
        <strong>{auditTarget(row)}</strong><span>{auditAction(row)}{auditTime(row)}</span>
      </li>)}</ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thao tác quản trị" />}
  </Card>;
}

export default function OperationsInsightsPanel() {
  return <Audit />;
}

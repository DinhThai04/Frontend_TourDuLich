import { useState } from 'react';
import { Alert, Button, Collapse, DatePicker, Descriptions, InputNumber, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
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
  { key: 'expired', label: 'Đơn trong kỳ đã hết hạn' },
  { key: 'collected', label: 'Tiền đã thu theo ngày thanh toán', money: true },
  { key: 'schedule_refunds', label: 'Hoàn tiền theo hồ sơ dời lịch', money: true },
  { key: 'reconciliation_refunds', label: 'Hoàn tiền theo hồ sơ đối soát', money: true },
  { key: 'confirmed_passengers', label: 'Khách xác nhận theo ngày khởi hành' },
] as const;

function Report() {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [query, setQuery] = useState<{ from: string; through: string }>();
  const valid = !!range?.[0] && !!range[1] && range[1].diff(range[0], 'day') < 31;
  const { data, loading, error } = useApiQuery(
    () => read<Record<string, number>>('/report', query), { deps: [query], enabled: !!query },
  );

  function download() {
    if (!data || !query) return;
    const lines = ['Chỉ tiêu,Giá trị', ...reportMetrics.map(metric => `${metric.label},${Number(data[metric.key])}`)];
    const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sgu-tour-${query.from}-${query.through}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <Space direction="vertical" className="w-full" size="middle">
    <Space wrap>
      <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" />
      <Button type="primary" loading={loading} disabled={!valid} onClick={() => {
        if (range?.[0] && range[1]) setQuery({ from: range[0].format('YYYY-MM-DD'), through: range[1].format('YYYY-MM-DD') });
      }}>Xem báo cáo</Button>
      <Button disabled={!data || loading || !!error} onClick={download}>Tải CSV</Button>
    </Space>
    <Typography.Text type="secondary">Tối đa 31 ngày, theo giờ Việt Nam. Hai chỉ tiêu hoàn tiền được báo cáo theo từng nguồn.</Typography.Text>
    {error && <Alert type="error" showIcon message={error} />}
    {data && query && !loading && !error && <Descriptions bordered size="small" column={1}
      title={`Từ ${query.from} đến ${query.through}`}
      items={reportMetrics.map(metric => ({ key: metric.key, label: metric.label,
        children: 'money' in metric ? formatCurrencyVND(Number(data[metric.key])) : Number(data[metric.key]),
      }))} />}
  </Space>;
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

function Deliveries({ admin }: { admin: boolean }) {
  const [id, setId] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<number>();
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

type AuditRow = { id: number; area: string; target_id: number; actor_id: number; before_value?: string; after_value?: string; created_at: string };
const auditLabels: Record<string, string> = {
  CAPACITY: 'Sức chứa / lịch', MEETING_POINT: 'Điểm tập trung', PRICE: 'Bảng giá',
  ROLE: 'Vai trò', MAIL_RETRY: 'Gửi lại email',
};

function Audit() {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useApiQuery(() => read<AuditRow[]>('/audit', { page }), { deps: [page] });
  return <Space direction="vertical" className="w-full">
    {error && <Alert type="error" showIcon message={error} />}
    <Table size="small" rowKey="id" loading={loading} dataSource={loading || error ? undefined : data?.slice(0, 20)}
      pagination={false} scroll={{ x: 840 }} columns={[
        { title: 'Thay đổi', render: (_, row) => `${auditLabels[row.area] || row.area} #${row.target_id}` },
        { title: 'Người sửa', render: (_, row) => `#${row.actor_id}` },
        { title: 'Trước', dataIndex: 'before_value', width: '26%', className: 'whitespace-pre-wrap break-words' },
        { title: 'Sau', dataIndex: 'after_value', width: '26%', className: 'whitespace-pre-wrap break-words' },
        { title: 'Thời gian', dataIndex: 'created_at', render: date },
      ]} />
    {(page > 0 || !!data && data.length > 20) && <Space>
      <Button disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Trang trước</Button>
      <span>Trang {page + 1}</span>
      <Button disabled={!data || data.length <= 20 || loading || !!error} onClick={() => setPage(page + 1)}>Trang sau</Button>
    </Space>}
  </Space>;
}

type Review = { checkedAt: string; items: { booking_id: number; tour_departure_id: number; booking_status: string; issue: string }[] };
const issueLabels: Record<string, string> = {
  MISSING_DEPARTURE: 'Đơn không tìm thấy lịch khởi hành tương ứng',
  MISSING_PAID_INVOICE: 'Đã ghi nhận thanh toán nhưng chưa có hóa đơn tương ứng',
  MISSING_PAID_PAYMENT: 'Hóa đơn đã thanh toán nhưng thiếu khoản thu tương ứng',
  OVERDUE_HOLD: 'Giữ chỗ đã quá hạn và cần kiểm tra',
};

function Integrity() {
  const { data, loading, error, refresh } = useApiQuery(() => read<Review>('/integrity'));
  return <Space direction="vertical" className="w-full">
    <Space wrap>
      <Typography.Text type="secondary">
        Rà soát tối đa 200 đơn gần nhất. {data && `Quét lần cuối ${date(data.checkedAt)}.`}
      </Typography.Text>
      <Button size="small" loading={loading} onClick={() => void refresh()}>Tải kết quả gần nhất</Button>
    </Space>
    {error && <Alert type="error" showIcon message={error} />}
    <Table size="small" rowKey="booking_id" loading={loading} pagination={false} dataSource={data?.items}
      locale={{ emptyText: 'Chưa ghi nhận bất thường trong phạm vi rà soát' }} columns={[
        { title: 'Đơn', render: (_, row) => <Link to={bookingPath(row.booking_id)}>#{row.booking_id}</Link> },
        { title: 'Lịch khởi hành', dataIndex: 'tour_departure_id' },
        { title: 'Cần kiểm tra', dataIndex: 'issue', render: (value: string) => issueLabels[value] || value },
      ]} />
  </Space>;
}

export default function OperationsInsightsPanel({ bookings, invoices, admin }: { bookings: boolean; invoices: boolean; admin: boolean }) {
  if (!bookings && !admin) return null;
  return <Collapse className="mt-4" accordion destroyOnHidden items={[
    ...(bookings && invoices ? [{ key: 'report', label: 'Báo cáo theo ngày', children: <Report /> }] : []),
    ...(bookings ? [
      { key: 'mail', label: 'Trạng thái email theo đơn', children: <Deliveries admin={admin} /> },
      { key: 'integrity', label: 'Đơn cần rà soát', children: <Integrity /> },
    ] : []),
    ...(admin ? [{ key: 'audit', label: 'Nhật ký thao tác', children: <Audit /> }] : []),
  ]} />;
}

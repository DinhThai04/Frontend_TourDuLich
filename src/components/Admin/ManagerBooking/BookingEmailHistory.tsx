import { useState } from 'react';
import { Alert, Button, Empty, Modal, Space, Tag, message } from 'antd';
import { AdminTable as Table } from '@/components/Admin/Shared/AdminTable';
import axiosClient from '@/api/axios';
import { useApiQuery } from '@/hooks';
import type { ApiResponse } from '@/types/comment';
import { formatDatetime } from '@/utils';
import { errorMessage } from '@/utils/errors';

const endpoint = '/booking/operations';

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

export default function BookingEmailHistory({ canRetry, bookingId }: { canRetry: boolean; bookingId: number }) {
  const [selected, setSelected] = useState<Delivery>();
  const [saving, setSaving] = useState(false);
  const { data, loading, error, refresh } = useApiQuery(
    async () => {
      const response: ApiResponse<Delivery[]> = await axiosClient.get(`${endpoint}/deliveries/${bookingId}`);
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được lịch gửi email');
      return response.result;
    }, { deps: [bookingId] },
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
    <div className="flex justify-end"><Button loading={loading} onClick={() => void refresh()}>Tải lại lịch gửi</Button></div>
    {error && <Alert type="error" showIcon message={error} />}
    {!error && <Table size="small" rowKey="id" dataSource={loading ? undefined : data} loading={loading}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Đơn này chưa có lịch gửi email." /> }}
      pagination={false} scroll={{ x: 620 }} columns={[
        { title: 'Loại email', dataIndex: 'event_type', render: (value: string) => eventLabels[value] || value },
        { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <Tag>{deliveryLabels[value] || value}</Tag> },
        { title: 'Số lần thử', dataIndex: 'attempt_count' },
        { title: 'Lịch gửi', dataIndex: 'scheduled_at', render: value => value ? formatDatetime(value) : '—' },
        { title: 'Đã gửi lúc', dataIndex: 'sent_at', render: value => value ? formatDatetime(value) : '—' },
        ...(canRetry ? [{ title: 'Thao tác', render: (_: unknown, row: Delivery) => row.status === 'FAILED' && !row.sent_at &&
          <Button size="small" onClick={() => setSelected(row)}>Đưa vào hàng đợi</Button> }] : []),
      ]} />}
    <Modal title="Đưa email thất bại vào hàng đợi" open={!!selected} onOk={() => void retry()}
      onCancel={() => { if (!saving) setSelected(undefined); }} confirmLoading={saving} okText="Xác nhận" cancelText="Đóng">
      Hệ thống sẽ gửi lại theo lịch xử lý hàng đợi email.
    </Modal>
  </Space>;
}

import { useState } from 'react';
import { Alert, Button, Checkbox, Empty, Modal, Spin, Tag, message } from 'antd';
import axiosClient from '@/api/axios';
import { useApiQuery } from '@/hooks';
import type { ApiResponse } from '@/types/api';
import { formatDatetime } from '@/utils';
import { errorMessage } from '@/utils/errors';

const endpoint = '/booking/operations';

type Delivery = {
  id: number;
  event_type: string;
  source_service?: string;
  status: string;
  attempt_count: number;
  scheduled_at?: string;
  sent_at?: string;
  updated_at?: string;
};

const deliveryLabels: Record<string, { text: string; color?: string }> = {
  PENDING: { text: 'Đang chờ' },
  CLAIMED: { text: 'Đang chuẩn bị', color: 'processing' },
  DISPATCHING: { text: 'Đang gửi', color: 'processing' },
  UNKNOWN: { text: 'Chưa rõ kết quả', color: 'warning' },
  RETRY: { text: 'Chờ gửi lại', color: 'processing' },
  SENT: { text: 'Đã gửi', color: 'success' },
  FAILED: { text: 'Gửi thất bại', color: 'error' },
  CANCELLED: { text: 'Đã hủy' },
  SKIPPED: { text: 'Đã bỏ qua' },
};

const eventLabels: Record<string, string> = {
  PAYMENT_SUCCEEDED: 'Xác nhận thanh toán',
  PAYMENT_REMINDER: 'Nhắc thanh toán',
  PAYMENT_REMINDER_1: 'Nhắc thanh toán lần 1',
  PAYMENT_REMINDER_2: 'Nhắc thanh toán lần 2',
  DEPARTURE_REMINDER: 'Nhắc khởi hành',
  BOOKING_EXPIRED: 'Giữ chỗ hết hạn',
  BOOKING_CANCELLED: 'Hủy đơn',
  BOOKING_CREATED: 'Xác nhận giữ chỗ',
  HOLD_CREATED: 'Xác nhận giữ chỗ',
  BOOKING_CHANGED: 'Cập nhật lịch',
  BOOKING_CHANGE_UPDATED: 'Cập nhật dời lịch',
  PICKUP_OPTIONS_PUBLISHED: 'Thông báo điểm đón',
  PICKUP_CONFIRMED: 'Xác nhận điểm đón',
};

const grid = 'grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_auto]';

function DeliveryTime({ timestamp, label }: { timestamp?: string; label: string }) {
  return <div className="flex flex-wrap items-baseline gap-x-2">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="m-0 whitespace-nowrap tabular-nums">{timestamp ? formatDatetime(timestamp) : '—'}</dd>
  </div>;
}

export default function BookingEmailHistory({ canRetry, bookingId }: { canRetry: boolean; bookingId: number }) {
  const [selected, setSelected] = useState<Delivery>();
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const uncertain = selected?.status === 'UNKNOWN';
  const { data, loading, error, refresh } = useApiQuery(
    async () => {
      const response: ApiResponse<Delivery[]> = await axiosClient.get(`${endpoint}/deliveries/${bookingId}`);
      if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được lịch gửi email');
      return response.result;
    }, { deps: [bookingId] },
  );

  async function retry() {
    if (!selected || saving || (uncertain && !confirmed)) return;
    setSaving(true);
    try {
      const response: ApiResponse<boolean> = await axiosClient.post(
        `${endpoint}/deliveries/${bookingId}/${selected.id}/retry`, undefined,
        { params: { confirmUncertain: uncertain } },
      );
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

  return <div className="space-y-3">
    <div className="flex justify-end"><Button loading={loading} onClick={() => void refresh()}>Tải lại lịch gửi</Button></div>
    {error && <Alert type="error" showIcon message={error} />}
    {!error && <Spin spinning={loading}>
      {!data?.length ? <Empty className="py-6" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Đơn này chưa có lịch gửi email." /> :
        <ul className="m-0 list-none divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white p-0">
          {data.map(row => {
            const status = deliveryLabels[row.status];
            const canResend = canRetry && !row.sent_at && ['FAILED', 'UNKNOWN'].includes(row.status);
            return <li key={row.id} className={`${grid} items-start px-4 py-3`}>
              <div className="min-w-0">
                <div className="font-semibold">{eventLabels[row.event_type] ??
                  (row.source_service === 'payment-service' ? 'Thông báo thanh toán' : 'Thông báo đặt tour')}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Tag className="m-0 whitespace-nowrap" color={status?.color}>{status?.text ?? row.status}</Tag>
                  <span className="whitespace-nowrap text-xs text-slate-500">{row.attempt_count} lần thử</span>
                </div>
              </div>
              <dl className="m-0 grid gap-1">
                <DeliveryTime label="Lịch gửi" timestamp={row.scheduled_at} />
                {row.sent_at ? <DeliveryTime label="Đã gửi lúc" timestamp={row.sent_at} /> : <>
                  <div><dt className="sr-only">Đã gửi lúc</dt><dd className="m-0 text-xs text-slate-500">Chưa xác nhận gửi</dd></div>
                  {row.attempt_count > 0 && row.updated_at && <DeliveryTime label="Cập nhật lúc" timestamp={row.updated_at} />}
                </>}
              </dl>
              {canResend && <Button className="justify-self-start" size="small" onClick={() => {
                setConfirmed(false);
                setSelected(row);
              }}>Gửi lại</Button>}
            </li>;
          })}
        </ul>}
    </Spin>}
    <Modal title="Gửi lại email" open={!!selected} onOk={() => void retry()}
      onCancel={() => { if (!saving) setSelected(undefined); }} confirmLoading={saving}
      okButtonProps={{ disabled: uncertain && !confirmed }} okText="Gửi lại" cancelText="Đóng">
      {uncertain ? <div className="space-y-3">
        <p>Lần gửi trước chưa rõ kết quả. Nếu người nhận đã nhận thư, gửi lại có thể tạo thư trùng.</p>
        <Checkbox checked={confirmed} onChange={event => setConfirmed(event.target.checked)}>
          Tôi đã đối chiếu và xác nhận cần gửi lại thư này.
        </Checkbox>
      </div> : <p>Hệ thống sẽ đưa thư này vào hàng đợi để gửi lại.</p>}
    </Modal>
  </div>;
}

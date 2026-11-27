import { useState } from 'react';
import { Alert, Input, Modal, Select, Skeleton, Space } from 'antd';
import { assignBookingPickup, getAdminBookingPickup } from '@/services/bookingServices';
import { useApiQuery } from '@/hooks';
import { errorMessage } from '@/utils/errors';

export default function AdminPickupAssignment({ bookingId, onClose, onSaved }: {
  bookingId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [stop, setStop] = useState<string>();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { data, error, loading } = useApiQuery(async () => {
    const response = await getAdminBookingPickup(bookingId);
    if (response.code !== 1000) throw new Error(response.message);
    return response.result;
  }, { deps: [bookingId] });

  async function save() {
    if (!stop || !reason.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const response = await assignBookingPickup(bookingId, stop, reason.trim());
      if (response.code !== 1000) throw new Error(response.message);
      onSaved();
      onClose();
    } catch (failure) {
      setSaveError(errorMessage(failure, 'Chưa lưu được điểm đón.'));
    } finally {
      setSaving(false);
    }
  }

  return <Modal title={`Xử lý điểm đón · Đơn #${bookingId}`} open onCancel={onClose} onOk={() => void save()}
    closable={!saving} maskClosable={!saving} keyboard={!saving} confirmLoading={saving}
    cancelText="Hủy" okText="Xác nhận điểm đón" okButtonProps={{ disabled: !data?.editable || !reason.trim() || !stop || stop === data.selectedKey }}>
    {loading && <Skeleton active />}
    {(error || saveError) && <Alert showIcon type="error" message={saveError || error} />}
    {data && <Space direction="vertical" className="w-full" size="middle">
      {data.pickupStatus === 'NEEDS_RECONFIRMATION' && <Alert type="warning" showIcon message="Điểm đón đã đổi hoặc bị xóa. Xác nhận lại với khách trước khi lưu." />}
      {!data.editable && <Alert type="info" showIcon message="Chưa có điểm đón khả dụng hoặc đã qua thời điểm xử lý." />}
      <Select className="w-full" aria-label="Điểm đón" placeholder="Chọn điểm đón" value={stop ?? data.selectedKey}
        disabled={!data.editable || saving} onChange={setStop}
        options={data.options.map(option => ({
          value: option.confirmationKey, label: `${option.arrivalTime?.slice(0, 5)} · ${option.address}`,
        }))} />
      <Input.TextArea aria-label="Lý do chọn thay khách" placeholder="Lý do chọn thay khách" value={reason}
        maxLength={500} onChange={event => setReason(event.target.value)} disabled={!data.editable || saving} />
    </Space>}
  </Modal>;
}

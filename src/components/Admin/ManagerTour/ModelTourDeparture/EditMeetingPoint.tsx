import { useState } from 'react';
import { Alert, Form, Input, Modal, Spin } from 'antd';
import { useApiQuery } from '@/hooks';
import { getMeetingPoint, saveMeetingPoint, type MeetingPoint } from '@/services/tourServices';
import { errorMessage } from '@/utils/errors';

export default function EditMeetingPoint({ departureId, onClose }: { departureId: number; onClose: () => void }) {
  const [form] = Form.useForm<MeetingPoint>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { data, error, loading } = useApiQuery(async () => {
    const result = await getMeetingPoint(departureId);
    if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được điểm tập trung');
    const point = result.result;
    return point ? { ...point, arrivalTime: point.arrivalTime?.slice(0, 5) } : null;
  }, { deps: [departureId] });

  async function save(values: MeetingPoint) {
    if (saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const result = await saveMeetingPoint(departureId, { ...values, arrivalTime: values.arrivalTime || null });
      if (result.code !== 1000) throw new Error(result.message || 'Chưa lưu được điểm tập trung');
      onClose();
    } catch (failure) {
      setSaveError(errorMessage(failure));
    } finally { setSaving(false); }
  }

  return <Modal open title="Điểm tập trung" onCancel={() => { if (!saving) onClose(); }} onOk={() => form.submit()}
    confirmLoading={saving} okText="Lưu" cancelText="Đóng"
    okButtonProps={{ disabled: data === undefined || !!error }} closable={!saving} maskClosable={!saving}>
    {loading && <Spin />}
    {(error || saveError) && <Alert type="error" showIcon message={error || saveError} />}
    {data !== undefined && !error && <Form form={form} layout="vertical" onFinish={save} initialValues={data ?? {}}>
      <Form.Item label="Địa chỉ" name="address" extra="Xóa địa chỉ và các trường bên dưới để gỡ điểm tập trung">
        <Input maxLength={300} />
      </Form.Item>
      <Form.Item label="Cách nhận diện điểm hẹn" name="landmark"><Input maxLength={300} /></Form.Item>
      <Form.Item label="Giờ có mặt (giờ Việt Nam)" name="arrivalTime"><Input type="time" /></Form.Item>
      <Form.Item label="Liên kết chỉ đường" name="directionsUrl"
        rules={[{ pattern: /^https:\/\//i, message: 'Dùng liên kết HTTPS' }]}><Input maxLength={1000} /></Form.Item>
    </Form>}
  </Modal>;
}

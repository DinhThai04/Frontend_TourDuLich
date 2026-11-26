import dayjs from 'dayjs';
import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Spin, TimePicker } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import DepartureContext from './DepartureContext';
import type { ITourDeparture } from '@/types/Tour';
import { useApiQuery } from '@/hooks';
import { getMeetingPointOptions, saveMeetingPointOptions, type MeetingPoint } from '@/services/tourServices';
import { errorMessage } from '@/utils/errors';

export default function EditMeetingPoint({ departure, onClose }: { departure: ITourDeparture; onClose: () => void }) {
  const departureId = Number(departure.id);
  const [form] = Form.useForm<{ points: MeetingPoint[] }>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { data, error, loading } = useApiQuery(async () => {
    const result = await getMeetingPointOptions(departureId);
    if (result.code !== 1000) throw new Error(result.message || 'Chưa tải được các điểm tập trung');
    return result.result.map(point => ({ ...point, arrivalTime: point.arrivalTime?.slice(0, 5) }));
  }, { deps: [departureId] });

  async function save({ points }: { points?: MeetingPoint[] }) {
    if (saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const result = await saveMeetingPointOptions(departureId, points ?? []);
      if (result.code !== 1000) throw new Error(result.message || 'Chưa lưu được các điểm tập trung');
      onClose();
    } catch (failure) {
      setSaveError(errorMessage(failure));
    } finally { setSaving(false); }
  }

  return <Modal open centered width={920} title="Điểm tập trung" onCancel={() => { if (!saving) onClose(); }}
    onOk={() => form.submit()} confirmLoading={saving} okText="Lưu" cancelText="Đóng"
    okButtonProps={{ disabled: data === undefined || !!error }} closable={!saving} maskClosable={!saving}>
    <div className="admin-detail-grid">
      <section className="min-w-0">
        {loading && <Spin />}
        {(error || saveError) && <Alert className="!mb-3" type="error" showIcon message={error || saveError} />}
        {data !== undefined && !error && <Form form={form} layout="vertical" onFinish={save} initialValues={{ points: data }}>
          <Form.List name="points">
            {(fields, { add, remove }) => <>
              {fields.map((field, index) => (
                <Card key={field.key} size="small" className="!mb-3" title={`Điểm ${index + 1}`}
                  extra={<Button type="text" danger aria-label={`Xóa điểm ${index + 1}`}
                    icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}>
                  <Form.Item label="Địa chỉ" name={[field.name, 'address']}
                    rules={[{ required: true, whitespace: true, message: 'Nhập địa chỉ điểm tập trung' }]}>
                    <Input maxLength={300} />
                  </Form.Item>
                  <Form.Item label="Giờ có mặt (giờ Việt Nam)" name={[field.name, 'arrivalTime']}
                    rules={[{ required: true, message: 'Chọn giờ có mặt' }]}
                    getValueProps={value => ({ value: value ? dayjs(`2000-01-01T${value}`) : null })}
                    normalize={value => value?.format('HH:mm') ?? null}>
                    <TimePicker format="HH:mm" className="w-full" />
                  </Form.Item>
                  <Form.Item label="Cách nhận diện" name={[field.name, 'landmark']}><Input maxLength={300} /></Form.Item>
                  <Form.Item label="Liên kết chỉ đường" name={[field.name, 'directionsUrl']} className="!mb-0"
                    rules={[{ pattern: /^https:\/\//i, message: 'Dùng liên kết HTTPS' }]}>
                    <Input maxLength={1000} />
                  </Form.Item>
                </Card>
              ))}
              {fields.length < 3 && <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add()}>
                Thêm điểm tập trung
              </Button>}
            </>}
          </Form.List>
        </Form>}
      </section>
      <DepartureContext tourId={departure.tourId} departure={departure} />
    </div>
  </Modal>;
}

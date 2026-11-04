import React, { useEffect, useState } from 'react';
import { Form, InputNumber, DatePicker, Button, Card, Space, Alert, Checkbox, Descriptions, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { departureWallTime } from '@/utils/departureTime';
import { capacityUpdate, type DepartureCapacity } from '@/utils/departureCapacity';
interface Values { departureDate: Dayjs; returnDate: Dayjs; capacity: number; confirmCapacity: boolean }
interface Props { data: DepartureCapacity; onReload: () => Promise<void>; onSubmit: (values: ReturnType<typeof capacityUpdate>) => Promise<boolean>; onSavingChange?: (saving: boolean) => void }
export default function EditTourDeparture({ data, onReload, onSubmit, onSavingChange }: Props) {
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const inFlight = React.useRef(false);
  useEffect(() => { form.setFieldsValue({ departureDate: dayjs(data.departureDate), returnDate: dayjs(data.returnDate), capacity: data.capacity ?? undefined, confirmCapacity: false }); }, [data, form]);
  async function finish(values: Values) {
    if (inFlight.current) return;
    inFlight.current = true; setSaving(true); onSavingChange?.(true);
    try {
      const dates = data.scheduleEditable ? { departureDate: departureWallTime(values.departureDate), returnDate: departureWallTime(values.returnDate) } : undefined;
      await onSubmit(capacityUpdate(data, values.capacity, !!values.confirmCapacity, dates));
    } catch (error) { message.error(error instanceof Error ? error.message : 'Chưa cập nhật được lịch'); }
    finally { inFlight.current = false; setSaving(false); onSavingChange?.(false); }
  }
  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true; setSaving(true); onSavingChange?.(true);
    try { await onReload(); }
    finally { inFlight.current = false; setSaving(false); onSavingChange?.(false); }
  }
  return <Card title={`Sức chứa và lịch ${data.tourCode}`}>
    <Descriptions column={2} size="small" bordered items={[
      { key: 'paid', label: 'Đã thanh toán', children: data.paidSeats }, { key: 'held', label: 'Đang giữ', children: data.heldSeats },
      { key: 'remaining', label: 'Còn có thể đặt', children: data.availableSeats }, { key: 'version', label: 'Phiên bản', children: data.version },
    ]} />
    {!data.scheduleEditable && <Alert style={{ marginTop: 12 }} type="info" showIcon message="Không sửa ngày/giờ trực tiếp. Nếu chuyến cũ buộc phải dừng do sự cố, dùng mục Dời lịch và xử lý sự cố; chuyến đã khởi hành giữ nguyên lịch sử." />}
    {data.warnings.map(text => <Alert key={text} style={{ marginTop: 12 }} type="warning" message={text} />)}
    {data.issues.map(text => <Alert key={text} style={{ marginTop: 12 }} type="error" showIcon message={text} />)}
    <Form form={form} layout="vertical" onFinish={finish} disabled={saving} style={{ marginTop: 16 }}>
      <Form.Item name="departureDate" label="Ngày khởi hành" rules={[{ required: true }]}><DatePicker disabled={!data.scheduleEditable || saving} showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>
      <Form.Item name="returnDate" label="Ngày trở về" rules={[{ required: true }]}><DatePicker disabled={!data.scheduleEditable || saving} showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>
      <Form.Item name="capacity" label="Tổng sức chứa (người)" rules={[{ required: true }]} extra={`Không nhỏ hơn ${data.paidSeats + data.heldSeats} chỗ đã chiếm. Số còn lại do backend tính.`}>
        <InputNumber min={data.paidSeats + data.heldSeats} max={32767} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      {data.capacityReviewRequired && <Form.Item name="confirmCapacity" valuePropName="checked"><Checkbox>Tôi đã đối chiếu và xác nhận đây là tổng sức chứa thực tế của chuyến.</Checkbox></Form.Item>}
      <Space><Button onClick={() => void reload()} disabled={saving}>Tải lại dữ liệu mới</Button><Button htmlType="submit" type="primary" loading={saving} disabled={data.blockingIssues.length > 0}>Lưu sức chứa/lịch</Button></Space>
    </Form>
  </Card>;
}

import React, { useState } from 'react';
import { Form, InputNumber, DatePicker, Button, Card, Space, message } from 'antd';
import type { Dayjs } from 'dayjs';
import { departureWallTime } from '@/utils/departureTime';
interface Values { departureDate: Dayjs; returnDate: Dayjs; capacity: number }
interface Props { onSubmit?: (values: { departureDate: string; returnDate: string; capacity: number }) => Promise<boolean>; onSavingChange?: (saving: boolean) => void }
export default function AddTourDeparture({ onSubmit, onSavingChange }: Props) {
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const inFlight = React.useRef(false);
  async function finish(values: Values) {
    if (inFlight.current) return;
    inFlight.current = true; setSaving(true); onSavingChange?.(true);
    try {
      const payload = { capacity: values.capacity, departureDate: departureWallTime(values.departureDate), returnDate: departureWallTime(values.returnDate) };
      if (onSubmit && await onSubmit(payload)) form.resetFields();
    } catch (error) { message.error(error instanceof Error ? error.message : 'Chưa lưu được lịch'); }
    finally { inFlight.current = false; setSaving(false); onSavingChange?.(false); }
  }
  return <Card title="Thêm lịch khởi hành">
    <Form form={form} layout="vertical" onFinish={finish} disabled={saving}>
      <Form.Item name="departureDate" label="Ngày khởi hành" rules={[{ required: true }]}><DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>
      <Form.Item
        name="returnDate"
        label="Ngày trở về"
        dependencies={['departureDate']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value?: Dayjs) {
              const departure = getFieldValue('departureDate') as Dayjs | undefined;
              if (!value || !departure || value.isAfter(departure)) return Promise.resolve();
              return Promise.reject(new Error('Ngày trở về phải sau ngày khởi hành'));
            },
          }),
        ]}
      >
        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="capacity" label="Tổng sức chứa (người)" extra="Mỗi hành khách chiếm một chỗ. Lịch mới có số chỗ còn lại bằng tổng sức chứa." rules={[{ required: true }]}>
        <InputNumber min={1} max={32767} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      <Space><Button htmlType="reset">Làm mới</Button><Button type="primary" htmlType="submit" loading={saving}>Tạo lịch khởi hành</Button></Space>
    </Form>
  </Card>;
}

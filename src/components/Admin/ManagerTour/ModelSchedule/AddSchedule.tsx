import type { ItineraryFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { Form, Input, Select, Button, Card, Space } from 'antd';
import { MEAL_OPTIONS } from './mealOptions';
import { PlusOutlined } from '@ant-design/icons';

interface AddItineraryProps {
  onSubmit?: (values: ItineraryFormValues) => Promise<void> | void;
}

const AddItinerary: React.FC<AddItineraryProps> = ({ onSubmit }) => {
  const [form] = Form.useForm<ItineraryFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: ItineraryFormValues) => {
    // Enter in a field and the button both submit; a second write is never wanted.
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="🗺️ Thêm lịch trình tour"
      variant="borderless"
      style={{
        maxWidth: 600,
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        borderRadius: 12,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        size="middle"
        autoComplete="off"
        style={{ marginTop: 8 }}
      >
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề lịch trình' }]}
        >
          <Input placeholder="Ví dụ: Tham quan phố cổ Hội An..." allowClear />
        </Form.Item>

        <Form.Item
          label="Mô tả chi tiết"
          name="description"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả lịch trình' }]}
        >
          <Input.TextArea rows={4} placeholder="Mô tả hoạt động, điểm tham quan, ghi chú..." />
        </Form.Item>

        <Form.Item
          label="Bữa ăn"
          name="meal"
          rules={[{ required: true, message: 'Vui lòng chọn bữa ăn' }]}
        >
          <Select placeholder="Chọn bữa ăn trong ngày">
            {MEAL_OPTIONS.map((meal) => (
              <Select.Option key={meal} value={meal}>
                {meal}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button htmlType="reset">Làm mới</Button>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
              Thêm lịch trình
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddItinerary;
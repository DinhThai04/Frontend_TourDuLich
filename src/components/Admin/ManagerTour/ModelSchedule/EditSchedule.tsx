import type { IItinerary } from '@/types/Tour';
import type { ItineraryFormValues } from '@/types/adminForms';
import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { MEAL_OPTIONS } from './mealOptions';

interface EditItineraryProps {
  data?: IItinerary | null;
  onSubmit?: (values: ItineraryFormValues) => void | Promise<void>;
}

const EditItinerary: React.FC<EditItineraryProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm<ItineraryFormValues>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        meal: data.meal,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

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
    <div
      style={{
        padding: 24,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Nhập tiêu đề lịch trình" size="large" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả lịch trình' }]}
        >
          <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
        </Form.Item>

        <Form.Item
          label="Bữa ăn"
          name="meal"
          rules={[{ required: true, message: 'Vui lòng chọn bữa ăn' }]}
        >
          <Select placeholder="Chọn bữa ăn" size="large">
            {MEAL_OPTIONS.map((meal) => (
              <Select.Option key={meal} value={meal}>
                {meal}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
          <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 140 }} loading={submitting}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditItinerary;
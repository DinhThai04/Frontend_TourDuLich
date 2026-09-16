import React, { useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';

interface EditItineraryProps {
  data?: any;
  onSubmit?: (values: any) => void;
}

const EditItinerary: React.FC<EditItineraryProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm();

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

  const handleFinish = (values: any) => {
    console.log('Edit Itinerary:', values);
    if (onSubmit) onSubmit(values);
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

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
        </Form.Item>

        <Form.Item
          label="Bữa ăn"
          name="meal"
          rules={[{ required: true, message: 'Vui lòng chọn bữa ăn' }]}
        >
          <Select placeholder="Chọn bữa ăn" size="large">
            <Select.Option value="Sáng">Sáng</Select.Option>
            <Select.Option value="Trưa">Trưa</Select.Option>
            <Select.Option value="Tối">Tối</Select.Option>
            <Select.Option value="Tối">Trưa, Chiều</Select.Option>
            <Select.Option value="Sáng, Trưa, Tối">Sáng, Trưa, Chiều</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
          <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 140 }}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditItinerary;
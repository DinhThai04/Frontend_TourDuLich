import React from 'react';
import { Form, Input, Select, Button, Card, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AddItineraryProps {
  onSubmit?: (values: any) => void;
}

const AddItinerary: React.FC<AddItineraryProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log('Add Itinerary:', values);
    if (onSubmit) onSubmit(values);
    form.resetFields();
  };

  return (
    <Card
      title="🗺️ Thêm lịch trình tour"
      bordered={false}
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

        <Form.Item label="Mô tả chi tiết" name="description">
          <Input.TextArea rows={4} placeholder="Mô tả hoạt động, điểm tham quan, ghi chú..." />
        </Form.Item>

        <Form.Item
          label="Bữa ăn"
          name="meal"
          rules={[{ required: true, message: 'Vui lòng chọn bữa ăn' }]}
        >
          <Select placeholder="Chọn bữa ăn trong ngày">
            <Select.Option value="Sáng">Sáng</Select.Option>
            <Select.Option value="Trưa">Trưa</Select.Option>
            <Select.Option value="Tối">Tối</Select.Option>
            <Select.Option value="Tối">Trưa, Chiều</Select.Option>
            <Select.Option value="Sáng, Trưa, Tối">Sáng, Trưa, Chiều</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button htmlType="reset">Làm mới</Button>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Thêm lịch trình
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddItinerary;
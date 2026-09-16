import React from 'react';
import { Form, InputNumber, DatePicker, Button, Card, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AddTourDepartureProps {
  onSubmit?: (values: any) => void;
}

const AddTourDeparture: React.FC<AddTourDepartureProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      departureDate: values.departureDate?.format('YYYY-MM-DDTHH:mm:ss'),
      returnDate: values.returnDate?.format('YYYY-MM-DDTHH:mm:ss'),
    };

    if (onSubmit) onSubmit(payload);
    form.resetFields();
  };


  return (
    <Card
      title="Thêm ngày khởi hành tour"
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
        {/* Ngày khởi hành */}
        <Form.Item
          label="Ngày khởi hành"
          name="departureDate"
          rules={[{ required: true, message: 'Vui lòng chọn ngày khởi hành' }]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            placeholder="Chọn ngày khởi hành..."
          />
        </Form.Item>

        {/* Ngày kết thúc */}
        <Form.Item
          label="Ngày kết thúc"
          name="returnDate"
          rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            placeholder="Chọn ngày kết thúc..."
          />
        </Form.Item>

        {/* Số lượng chỗ */}
        <Form.Item
          label="Số lượng chỗ"
          name="availableSeats"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng chỗ' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập số lượng chỗ..." />
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

export default AddTourDeparture;

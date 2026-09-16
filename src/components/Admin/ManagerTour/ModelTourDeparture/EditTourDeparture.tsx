import React, { useEffect } from 'react';
import { Form, InputNumber, DatePicker, Button, Card, Space } from 'antd';
import dayjs from 'dayjs'; // THÊM IMPORT dayjs

interface EditTourDepartureProps {
  data?: any; 
  onSubmit?: (values: any) => void;
}

const EditTourDeparture: React.FC<EditTourDepartureProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (data) {
      // CHUYỂN ĐỔI DATE STRING THÀNH dayjs OBJECT
      form.setFieldsValue({
        departureDate: data.departureDate ? dayjs(data.departureDate) : null,
        returnDate: data.returnDate ? dayjs(data.returnDate) : null,
        availableSeats: data.availableSeats,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      departureDate: values.departureDate?.toISOString(),
      returnDate: values.returnDate?.toISOString(),
    };

    console.log('Edit Departure:', payload);
    if (onSubmit) onSubmit(payload);
  };

  return (
    <Card
      title="Chỉnh sửa ngày khởi hành tour"
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
            format="DD/MM/YYYY HH:mm" // THÊM FORMAT CHO RÕ RÀNG
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
            format="DD/MM/YYYY HH:mm" // THÊM FORMAT CHO RÕ RÀNG
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
          <InputNumber 
            min={1} 
            style={{ width: '100%' }} 
            placeholder="Nhập số lượng chỗ..." 
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button 
              htmlType="button" 
              onClick={() => form.resetFields()}
            >
              Làm mới
            </Button>
            <Button type="primary" htmlType="submit">
              Cập nhật lịch trình
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditTourDeparture;
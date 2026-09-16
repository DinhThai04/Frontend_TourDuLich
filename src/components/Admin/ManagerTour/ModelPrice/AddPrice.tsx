import React from 'react';
import { Form, Input, Button, Card, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AddPriceProps {
  onSubmit?: (values: any) => void;
}

const AddPrice: React.FC<AddPriceProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log('Add Itinerary:', values);
    if (onSubmit) onSubmit(values);
    form.resetFields();
  };

  return (
    <Card
      title="🗺️ Thêm giá tour"
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
          label="Giá người lớn"
          name="adultPrice"
          rules={[{ required: true, message: 'Vui lòng giá người lớn' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label="Giá trẻ em"
          name="childPrice"
          rules={[{ required: true, message: 'Vui lòng giá trẻ em' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label="Giá trẻ nhỏ"
          name="toddlerPrice"
          rules={[{ required: true, message: 'Vui lòng giá trẻ nhỏ' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label="Giá em bé"
          name="infantPrice"
          rules={[{ required: true, message: 'Vui lòng giá em bé ' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          label="Giá phụ thu phòng đơn"
          name="singleSupplementPrice"
          rules={[{ required: true, message: 'Vui lòng giá phụ thu phòng đơn' }]}
        >
          <Input allowClear />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button htmlType="reset">Làm mới</Button>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Thêm
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddPrice;

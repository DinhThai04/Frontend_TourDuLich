import type { PriceFormValues } from '@/types/adminForms';
import React, { useState } from 'react';
import { Form, InputNumber, Button, Card, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AddPriceProps {
  onSubmit?: (values: PriceFormValues) => Promise<void> | void;
}

const AddPrice: React.FC<AddPriceProps> = ({ onSubmit }) => {
  const [form] = Form.useForm<PriceFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: PriceFormValues) => {
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
      title="🗺️ Thêm giá tour"
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
          label="Giá người lớn"
          name="adultPrice"
          rules={[{ required: true, message: 'Vui lòng giá người lớn' }]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Giá trẻ em"
          name="childPrice"
          rules={[{ required: true, message: 'Vui lòng giá trẻ em' }]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Giá trẻ nhỏ"
          name="toddlerPrice"
          rules={[{ required: true, message: 'Vui lòng giá trẻ nhỏ' }]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Giá em bé"
          name="infantPrice"
          rules={[{ required: true, message: 'Vui lòng giá em bé ' }]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Giá phụ thu phòng đơn"
          name="singleSupplementPrice"
          rules={[{ required: true, message: 'Vui lòng giá phụ thu phòng đơn' }]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button htmlType="reset">Làm mới</Button>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
              Thêm
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddPrice;

import React, { useEffect } from 'react';
import { Form, InputNumber, Button, Divider, Card, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface EditPriceProps {
  data?: any;
  onSubmit?: (values: any) => void;
}

const EditPrice: React.FC<EditPriceProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        adultPrice: data.adultPrice,
        childPrice: data.childPrice,
        infantPrice: data.infantPrice,
        toddlerPrice: data.toddlerPrice,
        singleSupplementPrice: data.singleSupplementPrice,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const handleFinish = (values: any) => {
    console.log('Edit Price:', values);
    if (onSubmit) onSubmit(values);
  };

  return (
    <Card
      title={"Chỉnh sửa Giá Tour"}
      bordered={false}
      style={{
        maxWidth: 600,
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
      }}
    >
      <Divider style={{ margin: '12px 0' }} />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Item
            label="Giá người lớn (VNĐ)"
            name="adultPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá người lớn' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            label="Giá trẻ em (VNĐ)"
            name="childPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá trẻ em' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              placeholder="0"
            />
          </Form.Item>
        </Space>

        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Item
            label="Giá em bé (VNĐ)"
            name="toddlerPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá em bé' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            label="Giá sơ sinh (VNĐ)"
            name="infantPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá sơ sinh' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              placeholder="0"
            />
          </Form.Item>
        </Space>

        <Form.Item
          label="Phụ thu phòng đơn (VNĐ)"
          name="singleSupplementPrice"
          rules={[{ required: true, message: 'Vui lòng nhập phụ thu phòng đơn' }]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            size="large"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large" style={{ minWidth: 160 }}>
            Cập nhật Giá
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditPrice;
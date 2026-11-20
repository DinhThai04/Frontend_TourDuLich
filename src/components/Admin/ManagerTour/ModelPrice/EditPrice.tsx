import { formatCurrencyVND } from '@/utils';
import type { ITourPrice } from '@/types/Tour';
import type { PriceFormValues } from '@/types/adminForms';
import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Button, Divider, Card, Descriptions, Modal, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface EditPriceProps {
  data?: ITourPrice | null;
  onSubmit?: (values: PriceFormValues) => void | Promise<void>;
}

const fields = [
  ['adultPrice', 'Người lớn'], ['childPrice', 'Trẻ em'], ['toddlerPrice', 'Trẻ nhỏ'],
  ['infantPrice', 'Em bé'], ['singleSupplementPrice', 'Phụ thu phòng đơn'],
] as const;

const EditPrice: React.FC<EditPriceProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm<PriceFormValues>();
  const [preview, setPreview] = useState<PriceFormValues>();
  const [submitting, setSubmitting] = useState(false);

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

  const handleFinish = async (values: PriceFormValues) => {
    // Enter in a field and the button both submit; a second write is never wanted.
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(values);
      setPreview(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={"Chỉnh sửa Giá Tour"}
      variant="borderless"
      style={{
        maxWidth: 600,
        margin: '0 auto',
        boxShadow: 'none',
        borderRadius: 12,
      }}
    >
      <Divider style={{ margin: '12px 0' }} />
      <Form form={form} layout="vertical" onFinish={setPreview}>
        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Item
            label="Giá người lớn (VNĐ)"
            name="adultPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá người lớn' }]}
          >
            <InputNumber<number>
              min={0}
              precision={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/[^\d.-]/g, '') || 0)}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            label="Giá trẻ em (VNĐ)"
            name="childPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá trẻ em' }]}
          >
            <InputNumber<number>
              min={0}
              precision={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/[^\d.-]/g, '') || 0)}
              placeholder="0"
            />
          </Form.Item>
        </Space>

        <Space size="large" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Form.Item
            label="Giá trẻ nhỏ (VNĐ)"
            name="toddlerPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá trẻ nhỏ' }]}
          >
            <InputNumber<number>
              min={0}
              precision={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/[^\d.-]/g, '') || 0)}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            label="Giá em bé (VNĐ)"
            name="infantPrice"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá em bé' }]}
          >
            <InputNumber<number>
              min={0}
              precision={0}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/[^\d.-]/g, '') || 0)}
              placeholder="0"
            />
          </Form.Item>
        </Space>

        <Form.Item
          label="Phụ thu phòng đơn (VNĐ)"
          name="singleSupplementPrice"
          rules={[{ required: true, message: 'Vui lòng nhập phụ thu phòng đơn' }]}
        >
          <InputNumber<number>
            min={0}
            precision={0}
            style={{ width: '100%' }}
            size="large"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => Number(value?.replace(/[^\d.-]/g, '') || 0)}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large" style={{ minWidth: 160 }} loading={submitting}>
            Xem trước bảng giá
          </Button>
        </Form.Item>
      </Form>
      <Modal title="Xem trước bảng giá" open={!!preview} onCancel={() => { if (!submitting) setPreview(undefined); }}
        confirmLoading={submitting} onOk={() => { if (preview) void handleFinish(preview); }}
        okText="Lưu bảng giá" cancelText="Quay lại">
        {data && preview && <Descriptions column={1} size="small" items={fields.map(([key, label]) => ({
          key, label, children: `${formatCurrencyVND(Number(data[key]))} → ${formatCurrencyVND(Number(preview[key]))}`,
        }))} />}
        <p className="mt-3">Giá mới áp dụng cho các lượt giữ chỗ tiếp theo. Đơn đã giữ chỗ tiếp tục dùng giá máy chủ đã chốt.</p>
      </Modal>
    </Card>
  );
};

export default EditPrice;
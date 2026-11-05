import { imageFileError } from '@/utils/tourMedia';
import { message } from 'antd';
import type { ILocation } from '@/types/Tour';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import type { LocationFormValues } from '@/types/adminForms';
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Card, Upload } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

interface EditLocationProps {
  data?: ILocation | null;
  onSubmit?: (values: LocationFormValues) => void | Promise<void>;
}

const EditLocation: React.FC<EditLocationProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm<LocationFormValues>();
  const [submitting, setSubmitting] = useState(false);

  // Hàm chuẩn hóa value cho Upload component trong Form
  const normFile = (e: UploadChangeParam<UploadFile> | UploadFile[]) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  useEffect(() => {
    if (data) {

      const fileList = data.img
        ? [
            {
              uid: '-1',
              name: data.img.split('/').pop() || 'image', // tên file từ url
              status: 'done' as const,
              url: data.img, // url ảnh hiện có
            },
          ]
        : [];

      form.setFieldsValue({
        name: data.city,
        type: data.type,
        img: fileList,
        city: data.city,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const handleFinish = async (values: LocationFormValues) => {
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
      title="Chỉnh sửa Điểm Đến"
      variant="borderless"
      style={{
        maxWidth: 600,
        margin: '0 auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 12,
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Thành phố"
          name="city"
          rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
        >
          <Input placeholder="Nhập thành phố" size="large" />
        </Form.Item>
        <Form.Item
          label="Loại điểm"
          name="type"
          rules={[{ required: true, message: 'Vui lòng chọn loại điểm' }]}
        >
          <Select placeholder="Chọn loại điểm" size="large">
            <Option value="DEPARTURE">DEPARTURE</Option>
            <Option value="DESTINATION">DESTINATION</Option>
          </Select>
        </Form.Item>

        {/* --- PHẦN BỔ SUNG: UPLOAD ẢNH --- */}
        <Form.Item
          label="Hình ảnh minh họa"
          name="img"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          extra="Chấp nhận file ảnh (jpg, png). Tối đa 1 file."
        >
          <Upload
            name="img"
            listType="picture"
            maxCount={1}
            beforeUpload={file => { const error = imageFileError(file); if (error) { message.error(error); return Upload.LIST_IGNORE; } return false; }} // Quan trọng: Chặn auto upload để gửi cùng form submit
            accept="image/jpeg,image/png,image/webp"
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh từ máy tính</Button>
          </Upload>
        </Form.Item>
        {/* -------------------------------- */}

        <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            size="large"
            loading={submitting}
            style={{ minWidth: 160 }}
          >
            Cập nhật Điểm Đến
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditLocation;

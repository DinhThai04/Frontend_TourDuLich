import React, { useEffect } from 'react';
import { Form, Input, Button, Select, Card, Upload } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

interface EditLocationProps {
  data?: any;
  onSubmit?: (values: any) => void;
}

const EditLocation: React.FC<EditLocationProps> = ({ data, onSubmit }) => {
  const [form] = Form.useForm();

  // Hàm chuẩn hóa value cho Upload component trong Form
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  useEffect(() => {
    if (data) {
      console.log('>>>>>>>>>>>>>>>>', data);

      const fileList = data.img
        ? [
            {
              uid: '-1',
              name: data.img.split('/').pop(), // tên file từ url
              status: 'done',
              url: data.img, // url ảnh hiện có
            },
          ]
        : [];

      form.setFieldsValue({
        name: data.name,
        type: data.type,
        img: fileList,
        country: data.country,
        city: data.city,
        description: data.description,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  const handleFinish = (values: any) => {
    if (onSubmit) onSubmit(values);
  };

  return (
    <Card
      title="Chỉnh sửa Điểm Đến"
      bordered={false}
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
            beforeUpload={() => false} // Quan trọng: Chặn auto upload để gửi cùng form submit
            accept="image/*"
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

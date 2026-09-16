import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, message } from 'antd';
import { createPermission } from '@/services/permissionService';

const { Option } = Select;

interface Role {
  id: number;
  name: string;
}

interface AddNewPermissionProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  allRoles: Role[];
  setIsAddNewPermission: (value: boolean) => void;
}

const AddNewPermission: React.FC<AddNewPermissionProps> = ({
  open,
  onClose,
  onSubmit,
  // allRoles,
  setIsAddNewPermission,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields(); // luôn reset khi mở
    }
  }, [open, form]);

  const handleFinish = async (values: any) => {
    onSubmit(values);
    try {
      let res = await createPermission(values);
      if (res.code === 201) {
        message.success('Thêm quyền thành công');
        setIsAddNewPermission(false);
        onClose();
      }
    } catch (error) {
      message.error('Thêm quyền thất bại');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsAddNewPermission(false);
    onClose();
  };

  return (
    <Modal
      title="Thêm quyền mới"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
      width={700}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        {/* Hàng 1 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tên quyền" name="name" rules={[{ required: true }]}>
              <Input placeholder="VD: USER_VIEW" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="API Path" name="apiPath" rules={[{ required: true }]}>
              <Input placeholder="/api/users" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Method" name="method" rules={[{ required: true }]}>
              <Select placeholder="Chọn method">
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Module" name="module" rules={[{ required: true }]}>
              <Select placeholder="Chọn module">
                <Option value="AUTH">AUTH</Option>
                <Option value="USERS">USERS</Option>
                <Option value="PERMISSIONS">PERMISSIONS</Option>
                <Option value="ROLES">ROLES</Option>
                <Option value="REVIEWS">REVIEWS</Option>
                <Option value="BOOKINGS">BOOKINGS</Option>
                <Option value="CUSTOMERS">CUSTOMERS</Option>
                <Option value="TOURS">TOURS</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Submit */}
        <Form.Item>
          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={handleCancel}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                Thêm mới
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddNewPermission;

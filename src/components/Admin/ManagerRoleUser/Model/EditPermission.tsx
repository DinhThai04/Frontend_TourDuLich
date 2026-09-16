import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';

const { Option } = Select;

// Kiểu dùng chung
interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  module: string;
  roles: Role[];
}

interface EditPermissionProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void; // cha xử lý update
  editingPermission: Permission | null;
  allRoles: Role[]; // list role đầy đủ
}

const EditPermission: React.FC<EditPermissionProps> = ({
  open,
  onClose,
  onSubmit,
  editingPermission,
  // allRoles,
}) => {
  const [form] = Form.useForm();

  // Fill form khi mở modal + có editingPermission
  useEffect(() => {
    if (open && editingPermission) {
      form.setFieldsValue({
        name: editingPermission.name,
        apiPath: editingPermission.apiPath,
        method: editingPermission.method,
        module: editingPermission.module,
        roles: editingPermission.roles?.map((r) => r.id) ?? [],
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editingPermission, form]);

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Chỉnh sửa quyền"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
      width={700}
      maskClosable={false}
      mask
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        {/* Hàng 1: Tên quyền - API Path */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên quyền"
              name="name"
              rules={[{ required: true, message: 'Nhập tên quyền' }]}
            >
              <Input placeholder="VD: Xem danh sách tour" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="API Path"
              name="apiPath"
              rules={[{ required: true, message: 'Nhập API path' }]}
            >
              <Input placeholder="/api/v1/tour/tours/list" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Method - Module */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Method"
              name="method"
              rules={[{ required: true, message: 'Chọn method' }]}
            >
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

        {/* Hàng 3: Roles */}

        <Form.Item style={{ marginTop: 16 }}>
          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={handleCancel}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                Lưu thay đổi
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPermission;

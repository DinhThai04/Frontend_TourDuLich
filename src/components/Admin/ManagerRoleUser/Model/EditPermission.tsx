import type { PermissionFormValues } from '@/types/Permission';
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
  code: string;
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  module: string;
  roles: Role[];
}

interface EditPermissionProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PermissionFormValues) => Promise<void>; // cha xử lý update
  editingPermission: Permission | null;
  allRoles: Role[]; // list role đầy đủ
  modules: string[];
  saving: boolean;
  canAssignRoles: boolean;
}

const EditPermission: React.FC<EditPermissionProps> = ({
  open,
  onClose,
  onSubmit,
  editingPermission,
  allRoles,
  modules,
  saving,
  canAssignRoles,
}) => {
  const [form] = Form.useForm<PermissionFormValues>();

  // Fill form khi mở modal + có editingPermission.
  // Chỉ chạm vào form khi modal đang mở: nội dung modal dùng destroyOnHidden nên form chưa mount lúc đóng.
  useEffect(() => {
    if (!open) return;
    if (editingPermission) {
      form.setFieldsValue({
        code: editingPermission.code,
        name: editingPermission.name,
        apiPath: editingPermission.apiPath,
        method: editingPermission.method,
        module: editingPermission.module,
        roles: editingPermission.roles?.map((r) => r.id) ?? [],
      });
    } else {
      form.resetFields();
    }
  }, [open, editingPermission, form]);

  const handleFinish = async (values: PermissionFormValues) => {
    // Enter in a field and the button both submit; the parent keeps `saving` for the whole write.
    if (saving) return;
    await onSubmit(values);
  };

  const handleCancel = () => {
    if (saving) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Chỉnh sửa quyền"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      centered
      width={700}
      maskClosable={false}
      mask
      styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item label="Mã quyền" name="code" extra="Mã là khóa phân quyền, không đổi được.">
          <Input disabled />
        </Form.Item>

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
              <Select
                placeholder="Chọn module"
                showSearch
                options={modules.map(module => ({ value: module, label: module }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {canAssignRoles && (
          <Form.Item name="roles" label="Vai trò được cấp quyền">
            <Select mode="multiple" options={allRoles.map(role => ({ value: role.id, label: role.name }))} />
          </Form.Item>
        )}

        <Form.Item style={{ marginTop: 16 }}>
          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={handleCancel}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={saving}>
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

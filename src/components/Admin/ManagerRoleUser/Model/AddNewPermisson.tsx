import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';
import type { PermissionFormValues } from '@/types/Permission';

const { Option } = Select;

interface Role {
  id: number;
  name: string;
}

interface AddNewPermissionProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PermissionFormValues) => Promise<void>;
  allRoles: Role[];
  modules: string[];
  saving: boolean;
  canAssignRoles: boolean;
}

const AddNewPermission: React.FC<AddNewPermissionProps> = ({
  open,
  onClose,
  onSubmit,
  allRoles,
  modules,
  saving,
  canAssignRoles,
}) => {
  const [form] = Form.useForm<PermissionFormValues>();

  useEffect(() => {
    if (open) {
      form.resetFields(); // luôn reset khi mở
    }
  }, [open, form]);

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
      title="Thêm quyền mới"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      centered
      width={700}
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          label="Mã quyền"
          name="code"
          normalize={(value: string) => value?.toUpperCase()}
          extra="Mã là khóa phân quyền, không đổi được sau khi tạo."
          rules={[
            { required: true, message: 'Nhập mã quyền' },
            {
              pattern: /^[A-Z][A-Z0-9_]{1,99}$/,
              message: 'Mã phải bắt đầu bằng chữ in hoa, chỉ gồm A-Z, 0-9 và dấu gạch dưới',
            },
          ]}
        >
          <Input placeholder="VD: TOURS_CREATE" />
        </Form.Item>

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
              <Select
                placeholder="Chọn module"
                showSearch
                options={modules.map(module => ({ value: module, label: module }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {canAssignRoles && (
          <Form.Item name="roles" label="Vai trò được cấp quyền" initialValue={[]}>
            <Select mode="multiple" options={allRoles.map(role => ({ value: role.id, label: role.name }))} />
          </Form.Item>
        )}
        {/* Submit */}
        <Form.Item>
          <Row gutter={16} justify="end">
            <Col>
              <Button onClick={handleCancel}>Hủy</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={saving}>
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

// src/pages/admin/users/components/UserFormModal.tsx
import React, { useEffect } from 'react';
import { Modal, Form, Row, Col, Input, Select } from 'antd';
import type { User } from '@/types/User.d';
import { createUser, updateUser } from '@/services/userServices';
import { toast } from 'react-toastify';

const { Option } = Select;

interface Role {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  loading?: boolean;
  mode: 'add' | 'edit';
  roles: Role[];
  initialValues?: User;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void> | void;
}

const UserFormModal: React.FC<Props> = ({
  open,
  loading,
  mode,
  roles,
  initialValues,
  onCancel,
  // onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          username: initialValues.username,
          email: initialValues.email,
          phone: initialValues.phone,
          address: initialValues.address,
          role: initialValues.role?.id, // sửa lấy id của role
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();

    if (mode === 'add') {
      const dataUser = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        address: values.address,
        roleId: values.role,
        password: values.password,
      };
      try {
        const res = await createUser(dataUser);
        if (res.code === 1000) {
          toast.success('Thêm người dùng thành công');
          form.resetFields();

          onCancel();
        }
      } catch (error) {
        toast.error('Người dùng đã tồn tại');
      }
    }

    if (mode === 'edit' && initialValues) {
      const dataUser = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        address: values.address,
        roleId: values.role,
        password: values.password,
      };
      try {
        const res = await updateUser(dataUser, initialValues.id);
        if (res.code === 1000) {
          toast.success('Cập nhật người dùng thành công');
          form.resetFields();
          onCancel();
        }
      } catch (error) {
        toast.error('Cập nhật người dùng thất bại');
      }
    }
  };

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'Thêm mới người dùng' : 'Cập nhật người dùng'}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Lưu"
      width={800}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>

          {mode === 'add' && (
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          )}

          {mode === 'edit' && (
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" disabled />
              </Form.Item>
            </Col>
          )}

          <Col span={12}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Địa chỉ" name="address">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn role' }]}
            >
              <Select placeholder="Chọn role">
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {mode === 'add' && (
            <Col span={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
          )}

          {mode === 'edit' && (
            <Col span={12}>
              <Form.Item label="Mật khẩu" name="password">
                <Input.Password placeholder="Nhập mật khẩu mới (nếu muốn đổi)" disabled />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default UserFormModal;

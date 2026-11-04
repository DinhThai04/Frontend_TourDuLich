import type { UserFormValues } from '@/types/adminForms';
import React, { useEffect, useState } from 'react';
import { Modal, Form, Row, Col, Input, Select } from 'antd';
import type { User } from '@/types/User.d';
import { createUser, updateUser } from '@/services/userServices';
import { toast } from 'react-toastify';
import { errorMessage } from '@/utils/errors';

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
  canChangeRole?: boolean;
  initialValues?: User;
  onCancel: () => void;
  onSubmit: () => Promise<void> | void;
}

const UserFormModal: React.FC<Props> = ({
  open,
  loading,
  mode,
  roles,
  canChangeRole = true,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<UserFormValues>();
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    let values: UserFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // AntD already highlights the invalid fields.
    }
    const dataUser = {
      username: values.username,
      email: values.email,
      phone: values.phone,
      address: values.address,
      roleId: values.role,
      password: values.password,
    };
    setSubmitting(true);
    try {
      if (mode === 'add') {
        const res = await createUser(dataUser);
        if (res.code !== 1000) {
          toast.error(res.message || 'Chưa tạo được người dùng');
          return;
        }
        toast.success('Thêm người dùng thành công');
      } else if (initialValues) {
        const res = await updateUser(dataUser, initialValues.id);
        if (res.code !== 1000) {
          toast.error(res.message || 'Chưa cập nhật được người dùng');
          return;
        }
        toast.success('Cập nhật người dùng thành công');
      }
      form.resetFields();
      await onSubmit();
      onCancel();
    } catch (error) {
      toast.error(errorMessage(error, mode === 'add' ? 'Chưa tạo được người dùng' : 'Chưa cập nhật được người dùng'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'Thêm mới người dùng' : 'Cập nhật người dùng'}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading || submitting}
      okText="Lưu"
      width={800}
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              name="username"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { min: 3, max: 50, message: 'Họ và tên phải từ 3 đến 50 ký tự' },
              ]}
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
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại phải có từ 9 đến 11 chữ số' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[
                { required: true, message: 'Vui lòng nhập địa chỉ' },
                { max: 255, message: 'Địa chỉ không được quá 255 ký tự' },
              ]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>

          {canChangeRole && (
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
          )}

          {mode === 'add' && (
            <Col span={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, max: 72, message: 'Mật khẩu phải từ 8 đến 72 ký tự' },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
          )}

        </Row>
      </Form>
    </Modal>
  );
};

export default UserFormModal;

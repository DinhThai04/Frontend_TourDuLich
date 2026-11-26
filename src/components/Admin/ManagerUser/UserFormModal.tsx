import { contactEmail, personName, streetAddress, strongPassword, vietnamesePhone } from '@/utils/contactValidation';
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
      username: values.username?.trim(),
      email: values.email?.trim(),
      phone: values.phone?.trim() || '',
      address: values.address?.trim(),
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
      centered
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
          <Col xs={24} sm={12}>
            <Form.Item
              label="Họ và tên"
              name="username"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' },
                { pattern: personName, transform: (value: string) => value?.trim(), message: 'Họ và tên chỉ gồm chữ và khoảng trắng' },
                { min: 3, max: 50, message: 'Họ và tên phải từ 3 đến 50 ký tự' },
              ]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>

          {mode === 'add' && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { pattern: contactEmail, max: 255, transform: (value: string) => value?.trim(), message: 'Nhập email có tên miền hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          )}

          {mode === 'edit' && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { pattern: contactEmail, max: 255, transform: (value: string) => value?.trim(), message: 'Nhập email có tên miền hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" disabled />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ pattern: vietnamesePhone, message: 'Số điện thoại bắt đầu bằng 0 và có 10–11 chữ số' }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập địa chỉ' },
                { pattern: streetAddress, transform: (value: string) => value?.trim(), message: 'Địa chỉ chứa ký tự không hợp lệ' },
                { max: 255, message: 'Địa chỉ không được quá 255 ký tự' },
              ]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>

          {canChangeRole && (
            <Col xs={24} sm={12}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò" showSearch optionFilterProp="children">
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
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, max: 72, message: 'Mật khẩu phải từ 8 đến 72 ký tự' },
                  { pattern: strongPassword, message: 'Cần chữ hoa, chữ thường, số và ký tự đặc biệt' },
                  { validator: async (_, value: string) => {
                    if (value && new TextEncoder().encode(value).length > 72) throw new Error('Mật khẩu tối đa 72 byte UTF-8');
                  } },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" autoComplete="new-password" />
              </Form.Item>
            </Col>
          )}

        </Row>
      </Form>
    </Modal>
  );
};

export default UserFormModal;

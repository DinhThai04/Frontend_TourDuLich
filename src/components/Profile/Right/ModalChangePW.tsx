import { changePW } from '@/services/authServices';
import { useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { errorMessage } from '@/utils/errors';
import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal } from 'antd';
import { useEffect, useState } from 'react';

interface PasswordFormValues { currentPassword: string; newPassword: string; confirmPassword: string }

interface IProps {
  visible: boolean;
  onClose: () => void;
}

const ModalChangePW = ({ visible, onClose }: IProps) => {
  const [form] = Form.useForm<PasswordFormValues>();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PasswordFormValues) => {
    // Enter in a field and the button both submit; a second password change is never wanted.
    if (submitting) return;
    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
      message.info('Vui lòng điền đầy đủ các trường');
      return;
    }
    setSubmitting(true);

    const currentPassword = values.currentPassword || '';
    const newPassword = values.newPassword || '';
    const confirmPassword = values.confirmPassword || '';

    // The authenticated session is the credential; the server identifies the user from it.
    const dataChangPW = {
      oldPassword: currentPassword,
      newPassword,
      confirmPassword,
    };

    try {
      const res = await changePW(dataChangPW);

      if (res.code === 1000) {
        message.success('Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại');
        // Chờ thunk gọi xong /auth/users/logout để token cũ bị thu hồi phía server;
        // không await thì chuyển trang có thể bỏ luôn request thu hồi.
        const result = await dispatch(logoutUser());
        if (logoutUser.rejected.match(result)) message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
      } else {
        message.error(res.message || 'Cập nhật thất bại.');
      }
    } catch (error) {
      message.error(errorMessage(error, 'Cập nhật thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [form, visible]);

  return (
    <Modal
      title="Đổi mật khẩu"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="!space-y-4">
        <Form.Item
          label="Mật khẩu cũ"
          name="currentPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[{ required: true, min: 8, message: 'Mật khẩu mới cần ít nhất 8 ký tự' }, { validator: (_, value: string) => !value || new TextEncoder().encode(value).length <= 72 ? Promise.resolve() : Promise.reject(new Error('Mật khẩu tối đa 72 byte UTF-8')) }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={() => form.submit()} loading={submitting} block>
            Xác nhận
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalChangePW;

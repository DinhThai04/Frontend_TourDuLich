import { changePW } from '@/services/authServices';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal } from 'antd';
import { useEffect } from 'react';

interface IProps {
  visible: boolean;
  onClose: () => void;
}

const ModalChangePW = ({ visible, onClose }: IProps) => {
  const { token } = useAppSelector((state: RootState) => state.auth);

  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  const handleSubmit = async (values: any) => {
    if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
      message.info('Vui lòng điền đầy đủ các trường');
      return;
    }

    const currentPassword = values.currentPassword || '';
    const newPassword = values.newPassword || '';
    const confirmPassword = values.confirmPassword || '';

    const dataChangPW = {
      oldPassword: currentPassword,
      newPassword,
      confirmPassword,
      token: token ?? '',
    };

    try {
      const res = await changePW(dataChangPW);

      if (res.code === 1000) {
        message.success('Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại');
        dispatch(logoutUser());
      } else {
        message.error('Cập nhật thất bại.');
      }
    } catch (error) {
      console.log(error);
      message.error('Cập nhật thất bại.');
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
      destroyOnClose
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
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
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
          <Button type="primary" onClick={() => form.submit()} block>
            Xác nhận
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalChangePW;

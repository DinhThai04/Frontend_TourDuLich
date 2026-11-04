import { errorMessage } from '@/utils/errors';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import ModalChangePW from './ModalChangePW';
import type { IUserUpdate } from '@/types/User';
import { uploadProfile } from '@/store/slices/authSlice';

const Info = () => {
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state: RootState) => state.auth);

  const [form] = Form.useForm<IUserUpdate & { email: string }>();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        file: undefined,
      });
    }
  }, [user, form]);

  const onFinish = async (values: IUserUpdate) => {
    // Enter in a field and the button both submit; a second profile write is never wanted.
    if (loading) return;
    if (!user) {
      message.error('Không tìm thấy thông tin người dùng. Vui lòng tải lại trang.');
      return;
    }

    const newPhone = values.phone || '';
    const oldPhone = user.phone || '';
    const newAddress = values.address || '';
    const oldAddress = user.address || '';

    if (newPhone === oldPhone && newAddress === oldAddress) {
      message.info('Không có thay đổi nào để lưu.');
      return;
    }
    // The profile API requires a non-blank address and a 9-11 digit phone, so blanking a
    // field would be silently ignored while the UI reported success.
    if ((oldPhone && !newPhone) || (oldAddress && !newAddress)) {
      message.error('Không thể xóa trắng số điện thoại hoặc địa chỉ. Vui lòng nhập giá trị mới.');
      return;
    }

    try {
      const updatedUser = await dispatch(
        uploadProfile({ data: values, userId: user?.id })
      ).unwrap();
      message.success('Cập nhật thông tin thành công!');
      form.setFieldsValue(updatedUser);
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Cập nhật thất bại.'));
    }
  };

  return (
    <div className="!space-y-4">
      <h3 className="text-xl font-semibold">Thông tin tài khoản</h3>

      {/* 6. Chuyển sang dùng Form */}
      <Form form={form} layout="vertical" onFinish={onFinish} className="!max-w-md">
        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Username" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{
            validator: (_, value: string) =>
              !value || /^[0-9]{9,11}$/.test(value)
                ? Promise.resolve()
                : Promise.reject(new Error('Số điện thoại phải có từ 9 đến 11 chữ số.')),
          }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input />
        </Form.Item>

        <Form.Item className="!mt-4">
          <div className="flex gap-2">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Lưu thay đổi
            </Button>
            <Button icon={<LockOutlined />} onClick={() => setOpenModal(true)}>
              Đổi mật khẩu
            </Button>
          </div>
        </Form.Item>
      </Form>

      <ModalChangePW visible={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
};

export default Info;

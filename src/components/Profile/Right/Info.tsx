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

  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        file: null,
      });
    }
  }, [user, form]);

  const onFinish = async (values: IUserUpdate) => {
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

    try {
      const updatedUser = await dispatch(
        uploadProfile({ data: values, userId: user?.id })
      ).unwrap();
      message.success('Cập nhật thông tin thành công!');
      form.setFieldsValue(updatedUser);
    } catch (error: any) {
      message.error(error.message || 'Cập nhật thất bại.');
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

        <Form.Item label="Số điện thoại" name="phone" >
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

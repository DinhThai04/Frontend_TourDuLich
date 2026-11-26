import { errorMessage } from '@/utils/errors';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import ModalChangePW from './ModalChangePW';
import type { IUserUpdate } from '@/types/User';
import { uploadProfile } from '@/store/slices/authSlice';

import VietnamAddressFields from '@/components/Share/VietnamAddressFields';
import { formatVietnamAddress, parseVietnamAddress, validateVietnamAddress, type AddressDraft } from '@/utils/vietnamAddress';
import { vietnamesePhone } from '@/utils/contactValidation';

type ProfileForm = IUserUpdate & { email: string; addressDraft?: AddressDraft };

const Info = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state: RootState) => state.auth);
  const [form] = Form.useForm<ProfileForm>();
  const phone = Form.useWatch('phone', form);
  const addressDraft = Form.useWatch('addressDraft', form);
  const currentAddress = user?.address ?? '';
  const isDirty = (phone ?? '').trim() !== (user?.phone ?? '').trim()
    || (editingAddress && formatVietnamAddress(addressDraft) !== currentAddress);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        addressDraft: undefined,
        file: undefined,
      });
      setEditingAddress(false);
    }
  }, [user, form]);

  const onFinish = async (values: ProfileForm) => {
    if (loading || !isDirty || !user) return;
    const newPhone = (values.phone || '').trim();
    const changedPhone = newPhone === (user.phone ?? '').trim() ? undefined : newPhone;
    const newAddress = editingAddress ? formatVietnamAddress(values.addressDraft) : undefined;
    if (editingAddress && !newAddress) return;
    try {
      const updatedUser = await dispatch(
        uploadProfile({ data: { phone: changedPhone, address: newAddress }, userId: user.id })
      ).unwrap();
      message.success('Cập nhật thông tin tài khoản thành công!');
      form.setFieldsValue(updatedUser);
      setEditingAddress(false);
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Cập nhật thất bại.'));
    }
  };

  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]">
      <div className="mb-6">
        <h1 className="m-0 text-[22px] font-semibold leading-[28px] text-[#1F2937]">Thông tin tài khoản</h1>
        <p className="mb-0 mt-1 text-sm text-[#6B7280]">Quản lý thông tin liên hệ và bảo mật cho tài khoản của bạn.</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="w-full"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Form.Item
            label={<span className="text-sm font-medium text-[#1F2937]">Email</span>}
            name="email"
            extra={<span className="text-xs text-[#6B7280]">Không thể thay đổi</span>}
          >
            <Input
              disabled
              suffix={<LockOutlined className="text-[#6B7280]" />}
              className="!h-[40px] !rounded-[10px] !bg-[#F3F4F6] !text-[#6B7280]"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-[#1F2937]">Tên tài khoản</span>}
            name="username"
            extra={<span className="text-xs text-[#6B7280]">Không thể thay đổi</span>}
          >
            <Input
              disabled
              suffix={<LockOutlined className="text-[#6B7280]" />}
              className="!h-[40px] !rounded-[10px] !bg-[#F3F4F6] !text-[#6B7280]"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-[#1F2937]">Số điện thoại</span>}
            name="phone"
            validateTrigger="onBlur"
            rules={[
              { required: !!user?.phone, message: 'Vui lòng nhập số điện thoại.' },
              {
                pattern: vietnamesePhone,
                message: 'Số điện thoại bắt đầu bằng 0 và có 10–11 chữ số.',
              },
            ]}
          >
            <Input placeholder="VD: 0912345678" className="!h-[40px] !rounded-[10px]" />
          </Form.Item>

          <div>
            <div className="mb-2 text-sm font-medium text-[#1F2937]">Địa chỉ</div>
            {editingAddress ? <>
              {currentAddress && !parseVietnamAddress(currentAddress).ward &&
                <p className="mb-2 break-words text-xs text-[#6B7280]">Địa chỉ đang lưu · {currentAddress}</p>}
              <Form.Item name="addressDraft" rules={[{ validator: validateVietnamAddress }]} validateTrigger="onSubmit">
                <VietnamAddressFields />
              </Form.Item>
              <Button type="link" className="!px-0" onClick={() => setEditingAddress(false)}>Hủy sửa địa chỉ</Button>
            </> : <button type="button" aria-label="Sửa địa chỉ" title={currentAddress || undefined} onClick={() => {
              form.setFieldValue('addressDraft', parseVietnamAddress(currentAddress));
              setEditingAddress(true);
            }} className="block min-h-10 w-full truncate rounded-[10px] border border-[#d9d9d9] bg-white px-3 py-2 text-left hover:border-[#1F7A6E]">
              {currentAddress || 'Thêm địa chỉ liên hệ'}
            </button>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#E5E7EB] pt-5">
          <Button
            icon={<LockOutlined />}
            onClick={() => setOpenModal(true)}
            className="!h-[40px] !rounded-[10px] !border-[#1F7A6E] !text-[#1F7A6E] hover:!bg-[#E6F4F1]"
          >
            Đổi mật khẩu
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            disabled={!isDirty}
            className={
              isDirty
                ? '!h-[40px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258]'
                : '!h-[40px] !rounded-[10px] !border-[#E5E7EB] !bg-[#E5E7EB] !text-[#9CA3AF]'
            }
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>

      <ModalChangePW visible={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
};

export default Info;

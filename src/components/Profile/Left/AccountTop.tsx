import { imageFileError } from '@/utils/tourMedia';
import { errorMessage } from '@/utils/errors';
import { useState } from 'react';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { uploadAvatar } from '@/store/slices/authSlice';
import type { IUserUpdate } from '@/types/User';
import { CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import { Avatar, message, Tooltip, Upload, Modal, Button } from 'antd';

const AccountTop = () => {
  const { user, loading } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const initial = (user?.username || user?.email || 'U').trim().charAt(0).toUpperCase();

  const handleCancel = () => {
    setIsModalOpen(false);
    setFileToUpload(null);
    setPreviewImage(null);
  };

  const beforeUpload = (file: File) => {
    const error = imageFileError(file);
    if (error || file.size > 2 * 1024 * 1024) {
      message.error(error || 'Avatar tối đa 2 MB');
      return Upload.LIST_IGNORE;
    }
    setFileToUpload(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setPreviewImage(reader.result as string);
    return false;
  };

  const handleConfirmUpload = async () => {
    if (!fileToUpload) {
      message.error('Vui lòng chọn một ảnh mới trước.');
      return;
    }
    const data: IUserUpdate = {
      username: user?.username,
      file: fileToUpload,
      phone: user?.phone,
      address: user?.address,
    };
    try {
      await dispatch(uploadAvatar({ data, userId: user?.id })).unwrap();
      message.success('Cập nhật ảnh đại diện thành công!');
      handleCancel();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Upload thất bại.'));
    }
  };

  return (
    <>
      <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]">
        <div className="flex flex-col items-center text-center">
          <Tooltip title="Nhấn để đổi ảnh đại diện" placement="bottom">
            <button
              type="button"
              aria-label="Đổi ảnh đại diện"
              className="group relative cursor-pointer rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A6E]"
              onClick={() => setIsModalOpen(true)}
            >
              <Avatar
                size={72}
                src={user?.avatar || undefined}
                icon={loading ? <LoadingOutlined /> : undefined}
                style={{
                  backgroundColor: '#E6F4F1',
                  color: '#134E48',
                  border: '2px solid #1F7A6E',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {!loading && initial}
              </Avatar>
              {!loading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <CameraOutlined className="text-xl !text-white" />
                </span>
              )}
            </button>
          </Tooltip>

          <div className="mt-3 w-full min-w-0">
            <h2 className="m-0 truncate text-base font-semibold text-[#1F2937]">
              {user?.username || 'Hội viên SGU Tour'}
            </h2>
            {user?.email && (
              <p className="mb-0 mt-1 truncate text-xs text-[#6B7280]">{user.email}</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Cập nhật ảnh đại diện"
        open={isModalOpen}
        onOk={handleConfirmUpload}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar
            size={160}
            src={previewImage || user?.avatar || undefined}
            style={{ backgroundColor: '#E6F4F1', color: '#134E48', border: '2px solid #1F7A6E', fontSize: 56, fontWeight: 700 }}
          >
            {initial}
          </Avatar>
          <Upload name="avatar" showUploadList={false} accept="image/jpeg,image/png,image/webp" beforeUpload={beforeUpload}>
            <Button icon={<CameraOutlined />}>Chọn ảnh mới</Button>
          </Upload>
        </div>
      </Modal>
    </>
  );
};

export default AccountTop;

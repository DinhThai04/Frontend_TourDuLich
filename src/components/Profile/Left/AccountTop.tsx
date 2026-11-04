import { imageFileError } from '@/utils/tourMedia';
import { errorMessage } from '@/utils/errors';
import { useState } from 'react'; // <-- Thêm useState
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { uploadAvatar } from '@/store/slices/authSlice';
import type { IUserUpdate } from '@/types/User';
import { CameraOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Avatar, message, Tooltip, Upload, Modal, Button } from 'antd';

const AccountTop = () => {
  const { user, loading } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showModal = () => {
    setIsModalOpen(true);
  };

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
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };

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
      message.success('Cập nhật avatar thành công!');
      handleCancel();
    } catch (error: unknown) {
      message.error(errorMessage(error, 'Upload thất bại.'));
    }
  };
  return (
    <>
      <Card className="flex items-center gap-4 shadow-md rounded-2xl">
        <Tooltip title="Ấn để đổi avatar" placement="bottom">
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            className="relative group cursor-pointer bg-transparent border-0 p-0"
            onClick={showModal}
          >
            <Avatar
              size={80}
              src={user?.avatar}
              icon={loading ? <LoadingOutlined /> : <UserOutlined />}
              className="border-2 border-gray-200"
            />
            {!loading && (
              <span
                className={`absolute w-full inset-0 bg-[#c1c1c1] bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <CameraOutlined className="!text-white text-2xl " />
              </span>
            )}
          </button>
        </Tooltip>

        <div>
          <h2 className="text-xl font-bold text-[#0b5da7] !mt-3">{user?.username}</h2>
          {/* <p className="text-gray-600 text-sm">{user?.email}</p> */}
        </div>
      </Card>

      {/* --- 6. Thêm Modal --- */}
      <Modal
        title="Cập nhật ảnh đại diện"
        open={isModalOpen}
        onOk={handleConfirmUpload}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <div className="flex flex-col items-center gap-4 !py-4">
          <Avatar
            size={200}
            src={previewImage || user?.avatar}
            icon={<UserOutlined />}
            className="border-2 border-gray-200"
          />
          <Upload
            name="avatar"
            showUploadList={false}
            accept="image/jpeg,image/png,image/webp" beforeUpload={beforeUpload} // <-- Chỉ dùng beforeUpload
            // Bỏ customRequest
          >
            <Button icon={<CameraOutlined />}>Chọn ảnh mới</Button>
          </Upload>
        </div>
      </Modal>
    </>
  );
};

export default AccountTop;

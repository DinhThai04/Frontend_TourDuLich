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
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Bạn chỉ có thể upload file JPG/PNG!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Hình ảnh phải nhỏ hơn 2MB!');
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
    } catch (error: any) {
      console.log('>>>>>>>>>>>>>>>>>>', error);
      message.error(error.message || 'Upload thất bại.');
    }
  };
  console.log('>>>>>>>>>>>>', user);
  return (
    <>
      <Card className="flex items-center gap-4 shadow-md rounded-2xl">
        <Tooltip title="Ấn để đổi avatar" placement="bottom">
          <div className="relative group cursor-pointer" onClick={showModal}>
            <Avatar
              size={80}
              src={user?.avatar}
              icon={loading ? <LoadingOutlined /> : <UserOutlined />}
              className="border-2 border-gray-200"
            />
            {!loading && (
              <div
                className={`absolute w-full inset-0 bg-[#c1c1c1] bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <CameraOutlined className="!text-white text-2xl " />
              </div>
            )}
          </div>
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
            beforeUpload={beforeUpload} // <-- Chỉ dùng beforeUpload
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

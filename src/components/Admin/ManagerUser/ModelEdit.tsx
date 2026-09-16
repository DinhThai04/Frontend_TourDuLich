// src/pages/admin/users/components/UserDetailModal.tsx
import React from 'react';
import { Modal, Button, Descriptions } from 'antd';
import type { User } from '@/types/User.d';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<Props> = ({ open, user, onClose }) => {
  return (
    <Modal
      open={open}
      title="Chi tiết người dùng"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {user && (
        <div style={{ textAlign: 'center' }}>
          {user.avatar && (
            <img
              src={user.avatar}
              alt="avatar"
              style={{ width: 100, height: 100, marginBottom: 16 }}
            />
          )}
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Họ và tên">{user.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{user.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{user.address || '—'}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">{user.role?.name || '—'}</Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  );
};

export default UserDetailModal;

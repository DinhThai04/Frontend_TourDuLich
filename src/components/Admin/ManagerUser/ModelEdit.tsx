import { Avatar, Drawer, Descriptions, Tag } from 'antd';
import type { User } from '@/types/User';
import { accountStatusLabels } from '@/utils/accounts';

export default function UserDetailModal({ open, user, onClose }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
}) {
  return <Drawer className="admin-record-drawer" open={open} title="Hồ sơ tài khoản" onClose={onClose} width={560} destroyOnHidden>
    {user && <div className="admin-dossier">
      <header className="admin-identity">
        <Avatar size={56} src={user.avatar}>{user.username?.slice(0, 1).toUpperCase()}</Avatar>
        <div><strong>{user.username}</strong><div>{user.email}</div></div>
        <Tag color={user.status === 'LOCKED' ? 'orange' : user.status === 'ARCHIVED' ? 'default' : 'green'}>
          {accountStatusLabels[user.status ?? 'ACTIVE']}
        </Tag>
      </header>
      <Descriptions title="Thông tin tài khoản" column={1} items={[
        { key: 'id', label: 'Mã tài khoản', children: `#${user.id}` },
        { key: 'email', label: 'Email', children: user.email || '—' },
        { key: 'phone', label: 'Số điện thoại', children: user.phone || '—' },
        { key: 'address', label: 'Địa chỉ', children: user.address || '—' },
        { key: 'role', label: 'Vai trò', children: user.role?.name || '—' },
      ]} />
    </div>}
  </Drawer>;
}

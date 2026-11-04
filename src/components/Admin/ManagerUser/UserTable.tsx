import UserAccountActions from './UserAccountActions';
import { accountStatusLabels } from '@/utils/accounts';
import React, { useMemo, useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Space, Tag, Button, Input, Avatar } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { User } from '@/types/User';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

interface Props {
  data: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onAdd: () => void;
  fetchData: () => void;
  loading?: boolean;
}

const UserTable: React.FC<Props> = ({ data, onView, onEdit, onAdd, fetchData, loading }) => {
  const actionRef = useRef<ActionType>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const canViewDetail = useHasPermission(ALL_PERMISSIONS.USERS.GET_DETAIL);
  const canCreateUser = useHasPermission(ALL_PERMISSIONS.USERS.REGISTER);
  const canUpdateUser = useHasPermission(ALL_PERMISSIONS.USERS.UPDATE);
  const canDeleteUser = useHasPermission(ALL_PERMISSIONS.USERS.DELETE);
  const canStatus = useHasPermission(ALL_PERMISSIONS.USERS.STATUS);
  const canArchive = useHasPermission(ALL_PERMISSIONS.USERS.ARCHIVE);
  const canEvents = useHasPermission(ALL_PERMISSIONS.USERS.EVENTS);

  const hasAnyAction = canViewDetail || canUpdateUser || canDeleteUser || canStatus || canArchive || canEvents;

  const columns: ProColumns<User>[] = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      search: false,
      width: 80,
      render: (_, record) => <Avatar>{(record.username || 'A')[0]}</Avatar>,
    },
    { title: 'Họ và tên', dataIndex: 'username', width: 150 },
    { title: 'Trạng thái', dataIndex: 'status', valueType: 'select', valueEnum: { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', ARCHIVED: 'Đã lưu trữ' }, render: (_, record) => <Tag color={record.status==='LOCKED'?'orange':record.status==='ARCHIVED'?'default':'green'}>{accountStatusLabels[record.status ?? 'ACTIVE']}</Tag> },
    { title: 'Email', dataIndex: 'email', width: 250 },
    { title: 'Số điện thoại', dataIndex: 'phone', search: false },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true, search: false },
    {
      title: 'Vai trò',
      dataIndex: ['role', 'name'],
      search: false,
      render: (_, record) => <Tag color="blue">{record.role?.name || '—'}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      valueType: 'option',
      hideInTable: !hasAnyAction, // không có quyền nào thì ẩn luôn cột
      render: (_, record) => (
        <Space>
          {canViewDetail && (
            <Button
              type="text"
              aria-label={`Xem chi tiết ${record.username || record.email}`}
              icon={<EyeOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
              onClick={() => onView(record)}
            />
          )}

          {canUpdateUser && record.status !== 'ARCHIVED' && (
            <Button
              type="text"
              aria-label={`Sửa ${record.username || record.email}`}
              icon={<EditOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
              onClick={() => onEdit(record)}
            />
          )}

          <UserAccountActions user={record} onChanged={fetchData} />
        </Space>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    if (!searchKeyword) return data;
    const keyword = searchKeyword.toLowerCase();
    return data.filter((user) => {
      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword) ||
        user.address?.toLowerCase().includes(keyword) ||
        user.role?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchKeyword]);

  return (
    <ProTable<User>
      headerTitle="Quản lý người dùng"
      columns={columns}
      rowKey="id"
      actionRef={actionRef}
      dataSource={filteredData}
      search={false}
      pagination={{ pageSize: 5 }}
      loading={loading}
      toolBarRender={() => [
        <Input.Search
          key="search"
          placeholder="Tìm kiếm người dùng..."
          allowClear
          style={{ width: 260, marginRight: 8 }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />,
        canCreateUser && (
          <Button type="primary" key="add" icon={<PlusOutlined />} onClick={onAdd}>
            Thêm người dùng
          </Button>
        ),
      ]}
    />
  );
};

export default UserTable;

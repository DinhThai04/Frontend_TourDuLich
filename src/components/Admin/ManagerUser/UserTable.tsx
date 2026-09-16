'use client';
import React, { useMemo, useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Space, Tag, Button, Popconfirm, Input, Avatar } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { User } from '@/types/User';
import { deleteUser } from '@/services/userServices';
import { toast } from 'react-toastify';
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

  const hasAnyAction = canViewDetail || canUpdateUser || canDeleteUser;

  const handleDeleteUser = async (id: number) => {
    if (!canDeleteUser) {
      toast.error('Bạn không có quyền xóa người dùng');
      return;
    }

    try {
      const res = await deleteUser(id);
      if (res.code === 1000) {
        toast.success('Xóa người dùng thành công');
        fetchData();
      } else {
        toast.error('Xóa người dùng thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Xóa người dùng thất bại');
    }
  };

  const columns: ProColumns<User>[] = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      search: false,
      width: 80,
      render: (_, record) => <Avatar>{(record.username || 'A')[0]}</Avatar>,
    },
    { title: 'Họ và tên', dataIndex: 'username', width: 150 },
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
            <EyeOutlined
              style={{ color: '#1677ff', fontSize: 18, cursor: 'pointer' }}
              onClick={() => onView(record)}
            />
          )}

          {canUpdateUser && (
            <EditOutlined
              style={{ color: '#52c41a', fontSize: 18, cursor: 'pointer' }}
              onClick={() => onEdit(record)}
            />
          )}

          {canDeleteUser && (
            <Popconfirm
              title="Bạn có chắc muốn xóa người dùng này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDeleteUser(record.id)}
            >
              <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />
            </Popconfirm>
          )}
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

import { useSearchParams } from 'react-router-dom';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import { AdminStatus } from '../Shared/AdminStatus';
import { adminPagination } from '../Shared/adminPagination';
import AdminPageHeader from '../Shared/AdminPageHeader';
import UserAccountActions from './UserAccountActions';
import { accountStatusLabels } from '@/utils/accounts';
import React, { useMemo, useRef, useState } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Space, Tag, Button, Input, Avatar, Select, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { User } from '@/types/User';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

interface Props {
  data: User[];
  roles?: { id: number; name: string }[];
  statusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  roleFilter?: number | null;
  onRoleFilterChange?: (val: number | null) => void;
  onResetFilters?: () => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onAdd: () => void;
  fetchData: () => void;
  loading?: boolean;
}

const UserTable: React.FC<Props> = ({
  data,
  roles = [],
  statusFilter = '',
  onStatusFilterChange,
  roleFilter = null,
  onRoleFilterChange,
  onResetFilters,
  onView,
  onEdit,
  onAdd,
  fetchData,
  loading,
}) => {
  const actionRef = useRef<ActionType>(null);
  const [params, setParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState<string>();
  const keywordText = searchKeyword ?? params.get('q') ?? '';

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
      title: 'Tài khoản',
      dataIndex: 'username',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar className="admin-user-avatar shrink-0" src={record.avatar}>{(record.username || 'A')[0]?.toUpperCase()}</Avatar>
          <div className="min-w-0">
            <strong>{record.username || '—'}</strong>
            <div className="text-xs text-slate-600">{record.email}</div>
            {record.phone && <div className="text-xs text-slate-600 md:hidden">{record.phone}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      hideInTable: !data.some(user => !!user.phone?.trim()),
      dataIndex: 'phone',
      width: '15%',
      responsive: ['md'],
      render: (_, record) => record.phone || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', ARCHIVED: 'Đã lưu trữ' },
      render: (_, record) => <AdminStatus tone={record.status === 'LOCKED' ? 'warning' : record.status === 'ARCHIVED' ? 'neutral' : 'success'}>{accountStatusLabels[record.status ?? 'ACTIVE']}</AdminStatus>,
    },
    {
      title: 'Vai trò',
      dataIndex: ['role', 'name'],
      width: 120,
      responsive: ['md'],
      search: false,
      render: (_, record) => <Tag className="admin-role-tag">{record.role?.name?.replace(/^khách hàng$/i, 'Khách hàng') || '—'}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 104,
      align: 'right',
      valueType: 'option',
      hideInTable: !hasAnyAction,
      render: (_, record) => <Space size={4}>
        {canViewDetail && <Button size="small" type="link" aria-label={`Xem chi tiết ${record.username || record.email}`} onClick={() => onView(record)}>Xem</Button>}
        <UserAccountActions user={record} onChanged={fetchData}
          onEdit={canUpdateUser && record.status !== 'ARCHIVED' ? () => onEdit(record) : undefined} />
      </Space>,
    },
  ];

  const filteredData = useMemo(() => {
    if (!keywordText) return data;
    const keyword = keywordText.toLowerCase();
    return data.filter((user) => {
      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword) ||
        user.address?.toLowerCase().includes(keyword) ||
        user.role?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [data, keywordText]);

  return (
    <div className="admin-dashboard">
    <AdminPageHeader title="Quản lý người dùng" description="Quản lý thông tin, vai trò và trạng thái tài khoản."
      actions={canCreateUser && <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>Thêm người dùng</Button>} />
    <ProTable<User> filterKey={JSON.stringify([searchKeyword, params.get("q")])}

      className="admin-data-table"
      headerTitle="Danh sách tài khoản"
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={keywordText || statusFilter || roleFilter ? 'Không có tài khoản khớp bộ lọc' : 'Chưa có tài khoản'} /> }}
      options={{ reload: fetchData, density: true, setting: true }}
      columns={columns}
      rowKey="id"
      actionRef={actionRef}
      dataSource={filteredData}
      search={false}
      size="small"
      tableLayout="fixed"
      pagination={adminPagination('tài khoản')}
      loading={loading}
      toolBarRender={() => [
        <Input.Search
          key="search"
          placeholder="Tìm theo tên, email, SĐT..."
          allowClear
          style={{ width: 230, maxWidth: '100%' }}
          value={keywordText}
          onChange={(e) => { setSearchKeyword(e.target.value); if (params.has('q')) setParams({}, { replace: true }); }}
        />,
        onStatusFilterChange && (
          <Select
            key="status"
            aria-label="Lọc trạng thái tài khoản"
            value={statusFilter || undefined}
            allowClear
            placeholder="Trạng thái"
            onChange={(value) => onStatusFilterChange(value ?? '')}
            options={[
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'LOCKED', label: 'Đã khóa' },
              { value: 'ARCHIVED', label: 'Đã lưu trữ' },
            ]}
            style={{ width: 145 }}
          />
        ),
        onRoleFilterChange && roles.length > 0 && (
          <Select
            key="role"
            aria-label="Lọc theo vai trò"
            value={roleFilter ?? undefined}
            allowClear
            placeholder="Vai trò"
            onChange={(value) => onRoleFilterChange(value ?? null)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            style={{ width: 145 }}
          />
        ),
        (keywordText || statusFilter || roleFilter) && (
          <Button
            key="reset"
            onClick={() => {
              setSearchKeyword(undefined);
              setParams({});
              onResetFilters?.();
            }}
          >
            Đặt lại
          </Button>
        ),
      ]}
    />
    </div>
  );
};

export default UserTable;

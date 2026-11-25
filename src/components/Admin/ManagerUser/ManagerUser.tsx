'use client';
import React, { useMemo, useState } from 'react';
import { Alert, message } from 'antd';

import { getListUser } from '@/services/userServices';
import { getRoles } from '@/services/rolesServices';
import { isApiSuccess } from '@/utils/apiResult';
import { isListCapped } from '@/utils';
import { useApiQuery } from '@/hooks';

import type { User } from '@/types/User.d';
import UserTable from './UserTable';
import UserDetailModal from './ModelEdit';
import UserFormModal from './UserFormModal';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerUser: React.FC = () => {
  const [searchRole, setSearchRole] = useState<number | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const canChangeRole = useHasPermission(ALL_PERMISSIONS.ROLES.UPDATE);

  const { data = [], loading: loadingUsers, refresh } = useApiQuery(
    async () => {
      const res = await getListUser();
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Lấy danh sách người dùng thất bại');
      return res.result;
    },
    { onError: (msg) => message.error(msg) },
  );

  const { data: roles = [] } = useApiQuery(
    async () => {
      const res = await getRoles();
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Lấy danh sách vai trò thất bại');
      return res.result.map((r) => ({ id: r.id, name: r.name }));
    },
    // The role list needs ROLES_GET_LIST; users who may only register customers must not see a 403.
    { enabled: canChangeRole, onError: (msg) => message.error(msg) },
  );

  const filteredData = useMemo(() => {
    return data.filter((u) => {
      const matchRole = searchRole ? u.role?.id === searchRole : true;
      return matchRole && (!statusFilter || (u.status ?? 'ACTIVE') === statusFilter);
    });
  }, [data, searchRole, statusFilter]);

  const handleResetFilter = () => {
    setStatusFilter('');
    setSearchRole(null);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setViewUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormModalOpen(true);
  };

  const handleSubmitUser = async () => {
    setFormLoading(true);
    try { await refresh(); setFormModalOpen(false); setEditingUser(null); }
    finally { setFormLoading(false); }
  };

  return (
    <div style={{ padding: 16, minHeight: '80vh' }}>
      {isListCapped(data) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Danh sách tài khoản đã đạt giới hạn 500 bản ghi. Dữ liệu có thể chưa đầy đủ, hãy lọc hoặc kiểm tra trực tiếp trước khi kết luận."
        />
      )}
      <UserTable
        data={filteredData}
        roles={roles}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={searchRole}
        onRoleFilterChange={setSearchRole}
        onResetFilters={handleResetFilter}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onAdd={handleOpenAddModal}
        fetchData={() => void refresh()}
        loading={loadingUsers}
      />

      <UserDetailModal
        open={viewModalOpen}
        user={viewUser}
        onClose={() => setViewModalOpen(false)}
      />

      <UserFormModal
        open={formModalOpen}
        loading={formLoading}
        roles={roles}
        initialValues={editingUser || undefined}
        mode={editingUser ? 'edit' : 'add'}
        canChangeRole={canChangeRole}
        onCancel={() => {
          setFormModalOpen(false);
          setEditingUser(null);
          void refresh();
        }}
        onSubmit={handleSubmitUser}
      />
    </div>
  );
};

export default ManagerUser;

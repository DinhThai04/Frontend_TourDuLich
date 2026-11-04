'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Button, Input, message, Row, Col, Select, Typography } from 'antd';

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

const { Option } = Select;

const ManagerUser: React.FC = () => {
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
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
      const matchName = (u.username ?? '').toLowerCase().includes(searchName.toLowerCase());
      const matchEmail = (u.email ?? '').toLowerCase().includes(searchEmail.toLowerCase());
      const matchRole = searchRole ? u.role?.id === searchRole : true;
      return matchName && matchEmail && matchRole && (!statusFilter || (u.status ?? 'ACTIVE') === statusFilter);
    });
  }, [data, searchName, searchEmail, searchRole, statusFilter]);

  const handleResetFilter = () => {
    setStatusFilter('');
    setSearchName('');
    setSearchEmail('');
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
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '80vh', overflowX: 'auto' }}>
      <Row
        gutter={[16, 16]}
        style={{
          marginBottom: 16,
          backgroundColor: '#fff',
          padding: 16,
          borderRadius: 8,
          marginLeft: 0,
          width: '100% ',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <Col xs={24} sm={12} md={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text>Tìm kiếm theo tên</Typography.Text>
            <Input
              id="searchName"
              placeholder="Nhập tên người dùng"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              allowClear
            />
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text>Tìm kiếm theo email</Typography.Text>
            <Input
              id="searchEmail"
              placeholder="Nhập email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              allowClear
            />
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography.Text>Chọn vai trò</Typography.Text>
            <Select
              id="searchRole"
              placeholder="Chọn vai trò"
              value={searchRole ?? undefined}
              onChange={(val: number | undefined) => setSearchRole(val ?? null)}
              allowClear
              style={{ width: '100%' }}
            >
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              height: '100%',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
            }}
          >
            <Typography.Text strong>Thao tác</Typography.Text>
            <Button onClick={handleResetFilter}>Reset</Button>
          </div>
        </Col>
      </Row>

      <Select aria-label="Lọc trạng thái tài khoản" value={statusFilter || undefined} allowClear placeholder="Tất cả trạng thái" onChange={value=>setStatusFilter(value ?? '')} options={[{value:'ACTIVE',label:'Hoạt động'},{value:'LOCKED',label:'Đã khóa'},{value:'ARCHIVED',label:'Đã lưu trữ'}]} style={{width:220,marginBottom:16}} />
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

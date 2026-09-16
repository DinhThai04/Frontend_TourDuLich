'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Row, Col, Select, Typography } from 'antd';

import { getListUser } from '@/services/userServices';
import { getRoles } from '@/services/rolesServices';

import type { User } from '@/types/User.d';
import UserTable from './UserTable';
import UserDetailModal from './ModelEdit';
import UserFormModal from './UserFormModal';

const { Option } = Select;

interface Role {
  id: number;
  name: string;
}

const ManagerUser: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRole, setSearchRole] = useState<number | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  console.log('Log để build không bị lỗi never read', loadingUsers, loadingRoles);
  const fetchData = async () => {
    setLoadingUsers(true);
    try {
      const res = await getListUser();
      setData(res?.code === 1000 ? res.result : []);
    } catch {
      message.error('Lấy danh sách người dùng thất bại');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await getRoles();
      if (res.code === 200) {
        const normalized = (res.result as any[]).map((r) => ({
          id: r.id ?? r.role_id,
          name: r.name,
        }));
        setRoles(normalized as Role[]);
      }
    } catch {
      message.error('Lấy danh sách vai trò thất bại');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((u) => {
      const matchName = (u.username ?? '').toLowerCase().includes(searchName.toLowerCase());
      const matchEmail = (u.email ?? '').toLowerCase().includes(searchEmail.toLowerCase());
      const matchRole = searchRole ? u.role?.id === searchRole : true;
      return matchName && matchEmail && matchRole;
    });
  }, [data, searchName, searchEmail, searchRole]);

  const handleResetFilter = () => {
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

  const handleSubmitUser = async (values: any) => {
    try {
      setFormLoading(true);
      if (editingUser) {
        setData((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
        message.success('Cập nhật người dùng thành công');
      } else {
        const newUser: User = {
          id: Date.now(),
          ...values,
          role: roles.find((r) => r.id === values.role) as Role,
          permissions: [],
        };
        setData((prev) => [newUser, ...prev]);
        message.success('Thêm người dùng thành công');
      }
      setFormModalOpen(false);
      setEditingUser(null);
    } finally {
      setFormLoading(false);
    }
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

      <UserTable
        data={filteredData}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onAdd={handleOpenAddModal}
        fetchData={fetchData}
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
        onCancel={() => {
          setFormModalOpen(false);
          setEditingUser(null);
          fetchData();
        }}
        onSubmit={handleSubmitUser}
      />
    </div>
  );
};

export default ManagerUser;

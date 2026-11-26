import { AdminStatus } from '../Shared/AdminStatus';
import AdminPageHeader from '../Shared/AdminPageHeader';
import { AdminProTable as ProTable } from '@/components/Admin/Shared/AdminTable';
import React, { useState } from 'react';
import {
  type ProColumns,
} from '@ant-design/pro-components';
import { Tag, Button, Space, Popconfirm, Input, Select, Typography, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/services/permissionService';
import { getRoles } from '@/services/rolesServices';
import { isApiSuccess } from '@/utils/apiResult';
import { useApiQuery } from '@/hooks';
import AddNewPermission from './Model/AddNewPermisson';
import EditPermission from './Model/EditPermission';
import ModelViewPermission from './Model/ModelViewPermission';
import type { PermissionFormValues, PermissionInput } from '@/types/Permission';
import axios from 'axios';

import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

// ==== Types ====
interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  module: string;
  roles: Role[];
}

// ==== Component ====
const ManagerRoleUser: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const [keyword, setKeyword] = useState('');
  const [module, setModule] = useState<string>();
  const [method, setMethod] = useState<string>();
  const [openModal, setOpenModal] = useState(false); // modal edit
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [isAddNewPermission, setIsAddNewPermission] = useState<boolean>(false); // modal add mới
  const [viewingPermission, setViewingPermission] = useState<Permission | null>(null);
  const [openView, setOpenView] = useState(false);

  const [saving, setSaving] = useState(false);
  const canListRoles = useHasPermission(ALL_PERMISSIONS.ROLES.GET_LIST);
  const canAssignRoles = useHasPermission(ALL_PERMISSIONS.ROLES.UPDATE);
  const showError = (error: unknown, fallback: string) => {
    message.error(axios.isAxiosError(error) ? error.response?.data?.message || fallback : error instanceof Error ? error.message : fallback);
  };
  // Lấy vai trò hiện có từ database qua API.
  const { data: allRoles = [] } = useApiQuery(
    async () => {
      const res = await getRoles();
      if (!isApiSuccess(res) || !Array.isArray(res.result)) throw new Error('Không tải được vai trò');
      return res.result;
    },
    { enabled: canListRoles, onError: (msg) => message.error(msg) },
  );

  // ===== QUYỀN =====
  const canList = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.GET_LIST);
  const canView = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.GET_DETAIL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.CREATE);
  const hasUpdatePermission = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.UPDATE);
  const canUpdate = hasUpdatePermission && canAssignRoles;
  const hasDeletePermission = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.DELETE);
  const canDelete = hasDeletePermission && canAssignRoles;

  const { data = [], refresh: reloadPermissions } = useApiQuery(
    async () => {
      const response = await getPermissions();
      if (!isApiSuccess(response)) throw new Error(response.message || 'Lấy danh sách quyền thất bại');
      return response.result;
    },
    { enabled: canList, onError: (msg) => message.error(msg) },
  );
  // Modules come from the database so the form can offer every module the backend actually uses.
  const moduleOptions = Array.from(new Set(data.map((permission) => permission.module))).sort();

  const handleDelete = async (id: number) => {
    if (!canDelete || saving) return;
    setSaving(true);
    try {
      const response = await deletePermission(id);
      if (!isApiSuccess(response)) throw new Error(response.message || 'Xóa quyền thất bại');
      await reloadPermissions();
      message.success('Đã xóa quyền trong database');
    } catch (error) { showError(error, 'Xóa quyền thất bại'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async (values: PermissionFormValues) => {
    if (saving || (editingPermission ? !canUpdate : !canCreate)) return;
    const request: PermissionInput = {
      name: values.name.trim(), apiPath: values.apiPath.trim(), method: values.method, module: values.module,
      ...(editingPermission ? { id: editingPermission.id } : { code: values.code?.trim().toUpperCase() }),
      ...(canAssignRoles ? { roleIds: values.roles ?? [] } : {}),
    };
    setSaving(true);
    try {
      const response = editingPermission ? await updatePermission(request) : await createPermission(request);
      if (!isApiSuccess(response)) throw new Error(response.message || 'Lưu quyền thất bại');
      await reloadPermissions();
      message.success(editingPermission ? 'Đã cập nhật quyền trong database' : 'Đã thêm quyền vào database');
      setOpenModal(false);
      setEditingPermission(null);
      setIsAddNewPermission(false);
    } catch (error) { showError(error, 'Lưu quyền thất bại'); }
    finally { setSaving(false); }
  };

  const columns: ProColumns<Permission>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 58,
      responsive: ['lg'],
      search: false,
    },
    {
      title: 'Quyền',
      dataIndex: 'name',

      ellipsis: true,
      render: (_, row) => row.name !== row.code ? row.name : <code>{row.code}</code>,
    },
    {
      title: 'Mã quyền',
      dataIndex: 'code',
      width: '25%',
      render: (_, row) => row.name === row.code ? <Typography.Text copyable={{ text: row.code }} /> : <Typography.Text code copyable>{row.code}</Typography.Text>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 82,
      responsive: ['md'],
      render: (_, row) => <AdminStatus tone={row.method === 'POST' ? 'success'
        : row.method === 'DELETE' ? 'danger' : row.method === 'GET' ? 'neutral' : 'warning'}>{row.method}</AdminStatus>,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 100,
      responsive: ['lg'],
      render: (_, row) => <Tag className="admin-role-tag">{row.module}</Tag>,
    },
    {
      title: 'Thuộc vai trò',
      dataIndex: 'roles',
      width: '18%',
      responsive: ['lg'],
      search: false,
      render: (_, record) =>
        record.roles?.slice(0, 2).map((r) => (
          <Tag key={r.id} style={{ marginBottom: 4 }}>
            {r.name}
          </Tag>
        )),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 136,
      render: (_, record) => (
        <Space size={4} wrap>
          {canView && (
            <Button
              type="text"
              size="small"
              aria-label="Xem quyền"
              icon={<EyeOutlined style={{ color: '#176258', fontSize: 18 }} />}
              onClick={() => {
                setViewingPermission(record);
                setOpenView(true);
              }}
            />
          )}

          {canUpdate && (
            <Button
              type="text"
              size="small"
              aria-label="Sửa quyền"
              icon={<EditOutlined style={{ color: '#176258', fontSize: 18 }} />}
              onClick={() => {
                setEditingPermission(record);
                setOpenModal(true);
              }}
            />
          )}

          {canDelete && (
            <Popconfirm
              title="Xóa quyền này?"
              description={`Đang được ${record.roles?.length ?? 0} vai trò sử dụng.`}
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                size="small"
                aria-label="Xóa quyền"
                icon={<DeleteOutlined style={{ color: '#991b1b', fontSize: 18 }} />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Không có quyền xem danh sách thì chặn luôn màn này
  if (!canList) {
    return <div>Bạn không có quyền quản lý quyền (permissions).</div>;
  }

  return (
    <div className="admin-dashboard">
      {!embedded && <AdminPageHeader title="Quyền hạn" description="Tra mã quyền theo module và xem các vai trò đang sử dụng quyền đó." />}
      <ProTable<Permission>
        headerTitle="Danh mục quyền"
        columns={columns}
        rowKey="id"
        search={false}
        options={{ reload: reloadPermissions }}
        filterKey={JSON.stringify([keyword, method, module])}
        dataSource={data.filter(item => (!method || item.method === method) && (!module || item.module === module)
          && [item.name, item.code].some(value => value.toLowerCase().includes(keyword.trim().toLowerCase())))}
        tableLayout="fixed"
        size="small"
        pagination={{ pageSize: 10 }}
        toolBarRender={() => [
          <Input key="query" allowClear aria-label="Tìm tên hoặc mã quyền" placeholder="Tên hoặc mã quyền"
            value={keyword} onChange={event => setKeyword(event.target.value)} />,
          <Select key="module" allowClear aria-label="Module" placeholder="Module" value={module} onChange={setModule}
            options={moduleOptions.map(value => ({ value, label: value }))} />,
          <Select key="method" allowClear aria-label="Method" placeholder="Method" value={method} onChange={setMethod}
            options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(value => ({ value, label: value }))} />,
          canCreate && (
            <Button
              type="primary"
              key="add"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPermission(null);
                setIsAddNewPermission(true);
              }}
            >
              Thêm quyền
            </Button>
          ),
        ]}
      />

      <AddNewPermission
        saving={saving}
        canAssignRoles={canAssignRoles}
        open={isAddNewPermission}
        onClose={() => {
          setIsAddNewPermission(false);
        }}
        onSubmit={handleSubmit}
        allRoles={allRoles}
        modules={moduleOptions}
      />

      <EditPermission
        saving={saving}
        canAssignRoles={canAssignRoles}
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingPermission(null);
        }}
        editingPermission={editingPermission}
        allRoles={allRoles}
        modules={moduleOptions}
        onSubmit={handleSubmit}
      />

      <ModelViewPermission
        open={openView}
        onClose={() => {
          setOpenView(false);
          setViewingPermission(null);
        }}
        viewingPermission={viewingPermission}
      />
    </div>
  );
};

export default ManagerRoleUser;

'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  PageContainer,
  ProTable,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { Tag, Button, Space, Popconfirm, message } from 'antd';
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
const ManagerRoleUser: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
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
  // ProTable keeps the request closure from its first render; the ref keeps filtering on fresh rows.
  const permissionsRef = useRef<Permission[]>(data);
  permissionsRef.current = data;
  useEffect(() => { actionRef.current?.reload(); }, [data]);
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
      width: 70,
      search: false,
    },
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      filterSearch: true,
    },
    {
      title: 'Mã quyền',
      dataIndex: 'code',
      render: (c) => <Tag color="geekblue">{c}</Tag>,
    },
    {
      title: 'API Path',
      dataIndex: 'apiPath',
      search: false,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
      valueEnum: {
        GET: { text: 'GET', color: 'blue' },
        POST: { text: 'POST', color: 'green' },
        PUT: { text: 'PUT', color: 'orange' },
        DELETE: { text: 'DELETE', color: 'red' },
      },
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 120,
      render: (m) => <Tag color="purple">{m}</Tag>,
      valueEnum: Array.from(new Set(data.map((d) => d.module))).reduce(
        (acc, cur) => {
          acc[cur] = { text: cur };
          return acc;
        },
        {} as Record<string, { text: string }>
      ),
    },
    {
      title: 'Thuộc Roles',
      dataIndex: 'roles',
      search: false,
      render: (_, record) =>
        record.roles?.map((r) => (
          <Tag key={r.id} style={{ marginBottom: 4 }}>
            {r.name}
          </Tag>
        )),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {canView && (
            <Button
              type="text"
              aria-label="Xem quyền"
              icon={<EyeOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
              onClick={() => {
                setViewingPermission(record);
                setOpenView(true);
              }}
            />
          )}

          {canUpdate && (
            <Button
              type="text"
              aria-label="Sửa quyền"
              icon={<EditOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
              onClick={() => {
                setEditingPermission(record);
                setOpenModal(true);
              }}
            />
          )}

          {canDelete && (
            <Popconfirm
              title="Bạn có chắc muốn xóa quyền này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                aria-label="Xóa quyền"
                icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
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
    <PageContainer>
      <ProTable<Permission>
        headerTitle="Quản Lý Quyền"
        columns={columns}
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 5 }}
        request={async (params) => {
          const keyword = params.name ? params.name.toLowerCase() : '';
          const CodeName = params.code ? params.code.toLowerCase() : '';
          const MethodName = params.method ? params.method.toLowerCase() : '';
          const ModuleName = params.module ? params.module.toLowerCase() : '';
          const filtered = permissionsRef.current.filter(
            (item) =>
              item.name.toLowerCase().includes(keyword) &&
              item.code.toLowerCase().includes(CodeName) &&
              item.method.toLowerCase().includes(MethodName) &&
              item.module.toLowerCase().includes(ModuleName)
          );
          return {
            data: filtered,
            success: true,
          };
        }}
        toolBarRender={() => [
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
    </PageContainer>
  );
};

export default ManagerRoleUser;

'use client';
import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Space, Tag, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import ModalAddNewRole from './ModelRole/ModalAddNewRole';
import ModelEditRole from './ModelRole/ModelEditRole';
import ModelViewRole from './ModelRole/ModelViewRole';
import { getRoles, deleteRole } from '@/services/rolesServices';
import { isApiSuccess } from '@/utils/apiResult';
import { errorMessage } from '@/utils/errors';
import { toast } from 'react-toastify';

import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

const ManagerRoleTour: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [openView, setOpenView] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ========= QUYỀN =========
  const canList = useHasPermission(ALL_PERMISSIONS.ROLES.GET_LIST);
  const canView = useHasPermission(ALL_PERMISSIONS.ROLES.GET_DETAIL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.ROLES.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.ROLES.UPDATE);
  const canDelete = useHasPermission(ALL_PERMISSIONS.ROLES.DELETE);

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      toast.error('Bạn không có quyền xóa vai trò');
      return;
    }
    if (deletingId !== null) return;

    setDeletingId(id);
    try {
      const res = await deleteRole(id);
      if (isApiSuccess(res)) {
        toast.success('Xóa vai trò thành công');
        reloadTable();
      } else {
        toast.error(res.message || 'Xóa vai trò thất bại');
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Xóa vai trò thất bại'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ProColumns<Role>[] = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      width: 200,
      render: (text) => <b>{text}</b>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'permissions',
      hideInSearch: true,
      render: (_, record) => {
        const max = 3;
        const list = record.permissions || [];
        const visible = list.slice(0, max);
        const hidden = list.length - max;
        return (
          <>
            {visible.map((p) => (
              <Tag key={p.id} color="blue" style={{ marginBottom: 4 }}>
                {p.name}
              </Tag>
            ))}
            {hidden > 0 && (
              <Tag color="cyan" style={{ marginBottom: 4 }}>
                +{hidden} quyền nữa
              </Tag>
            )}
          </>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 130,
      valueType: 'select',
      valueEnum: {
        true: { text: 'Hoạt động', status: 'Success' },
        false: { text: 'Ngừng hoạt động', status: 'Error' },
      },
      render: (_, record) =>
        record.active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngừng hoạt động</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space>
          {canView && (
            <Button
              type="text"
              aria-label="Xem vai trò"
              icon={<EyeOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
              onClick={() => {
                setViewingRole(record);
                setOpenView(true);
              }}
            />
          )}

          {canUpdate && (
            <Button
              type="text"
              aria-label="Sửa vai trò"
              icon={<EditOutlined style={{ color: '#1677ff', fontSize: 18 }} />}
              onClick={() => {
                setEditingRole(record);
                setOpenEdit(true);
              }}
            />
          )}

          {canDelete && (
            <Popconfirm
              title="Bạn có chắc muốn xóa vai trò này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ loading: deletingId === record.id, disabled: deletingId !== null }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                aria-label="Xóa vai trò"
                icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Không có quyền xem danh sách thì chặn luôn
  if (!canList) {
    return <div>Bạn không có quyền quản lý vai trò.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <ProTable<Role>
        headerTitle="Quản Lý Vai Trò"
        columns={columns}
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 5 }}
        loading={loading}
        request={async (params) => {
          try {
            if (!canList) {
              return { data: [], success: true, total: 0 };
            }

            setLoading(true);
            const res = await getRoles();
            if (!isApiSuccess(res)) {
              return { data: [], success: false, total: 0 };
            }

            const all: Role[] = res.result || [];

            const nameKeyword = (params.name || '').toLowerCase().trim();
            const descKeyword = (params.description || '').toLowerCase().trim();
            // ProTable select filters arrive as the string keys "true"/"false", not booleans.
            const rawStatus = params.active;
            const statusFilter =
              rawStatus === undefined || rawStatus === null || rawStatus === ''
                ? undefined
                : String(rawStatus) === 'true';

            let filtered = all;

            if (nameKeyword) {
              filtered = filtered.filter((role) => {
                const nameMatch = role.name.toLowerCase().includes(nameKeyword);
                const permMatch = role.permissions?.some((p) =>
                  p.name.toLowerCase().includes(nameKeyword)
                );
                return nameMatch || permMatch;
              });
            }

            if (descKeyword) {
              filtered = filtered.filter((role) =>
                (role.description || '').toLowerCase().includes(descKeyword)
              );
            }

            if (typeof statusFilter !== 'undefined') {
              filtered = filtered.filter((role) => role.active === statusFilter);
            }

            return {
              data: filtered,
              success: true,
              total: filtered.length,
            };
          } catch {
            message.error('Lấy danh sách vai trò thất bại');
            return { data: [], success: false, total: 0 };
          } finally {
            setLoading(false);
          }
        }}
        toolBarRender={() => [
          canCreate && (
            <Button
              type="primary"
              key="add"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRole(null);
                setOpenAddEdit(true);
              }}
            >
              Thêm vai trò
            </Button>
          ),
        ]}
      />

      <ModalAddNewRole open={openAddEdit} setOpen={setOpenAddEdit} fetchRoles={reloadTable} />

      <ModelEditRole
        open={openEdit}
        setOpen={setOpenEdit}
        role={editingRole}
        fetchRoles={reloadTable}
      />

      <ModelViewRole open={openView} setOpen={setOpenView} role={viewingRole} />
    </div>
  );
};

export default ManagerRoleTour;

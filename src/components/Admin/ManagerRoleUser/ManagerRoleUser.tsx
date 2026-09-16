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
import { getPermissions } from '@/services/permissionService';
import AddNewPermission from './Model/AddNewPermisson';
import EditPermission from './Model/EditPermission';
import ModelViewPermission from './Model/ModelViewPermission';

import { ALL_PERMISSIONS } from '@/config/permissions';
import { useHasPermission } from '@/config/useHasPermission';

// ==== Types ====
interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  module: string;
  roles: Role[];
}

// ==== Component ====
const ManagerRoleUser: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [data, setData] = useState<Permission[]>([]);
  const [openModal, setOpenModal] = useState(false); // modal edit
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [isAddNewPermission, setIsAddNewPermission] = useState<boolean>(false); // modal add mới
  const [viewingPermission, setViewingPermission] = useState<Permission | null>(null);
  const [openView, setOpenView] = useState(false);

  // Nếu sau này bạn có API lấy role thì thay vào đây
  const [allRoles] = useState<Role[]>([
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'STAFF' },
    { id: 3, name: 'USER' },
  ]);

  // ===== QUYỀN =====
  const canList = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.GET_LIST);
  const canView = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.GET_DETAIL);
  const canCreate = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(ALL_PERMISSIONS.PERMISSIONS.DELETE);

  const getPermissionsData = async () => {
    if (!canList) {
      setData([]);
      return;
    }

    try {
      const response = await getPermissions();
      if (response.code === 200) {
        setData(response.result);
      } else {
        message.error('Lấy danh sách quyền thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Lấy danh sách quyền thất bại');
    }
  };

  useEffect(() => {
    getPermissionsData();
  }, [canList]);

  const handleDelete = (id: number) => {
    if (!canDelete) {
      message.error('Bạn không có quyền xóa quyền này');
      return;
    }
    // TODO: gọi API delete permission tại đây
    setData((prev) => prev.filter((p) => p.id !== id));
    message.success('Xóa quyền thành công');
  };

  const handleSubmit = (values: any) => {
    const selectedRoles = allRoles.filter((r) => values.roles?.includes(r.id));

    const newPermission: Permission = {
      id: editingPermission ? editingPermission.id : Date.now(),
      name: values.name,
      apiPath: values.apiPath,
      method: values.method,
      module: values.module,
      roles: selectedRoles,
    };

    if (editingPermission) {
      if (!canUpdate) {
        message.error('Bạn không có quyền cập nhật quyền');
        return;
      }
      // TODO: gọi API update
      setData((prev) => prev.map((p) => (p.id === editingPermission.id ? newPermission : p)));
      message.success('Cập nhật quyền thành công');
    } else {
      if (!canCreate) {
        message.error('Bạn không có quyền thêm quyền');
        return;
      }
      // TODO: gọi API create
      setData((prev) => [...prev, newPermission]);
      message.success('Thêm quyền thành công');
    }

    setOpenModal(false);
    setEditingPermission(null);
    setIsAddNewPermission(false);
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
            <EyeOutlined
              style={{ color: '#1677ff', fontSize: 18, cursor: 'pointer' }}
              onClick={() => {
                setViewingPermission(record);
                setOpenView(true);
              }}
            />
          )}

          {canUpdate && (
            <EditOutlined
              style={{ color: '#1677ff', fontSize: 18, cursor: 'pointer' }}
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
              <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />
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
          let keyword = params.name ? params.name.toLowerCase() : '';
          let MethodName = params.method ? params.method.toLowerCase() : '';
          let ModuleName = params.module ? params.module.toLowerCase() : '';
          let filtered = data.filter(
            (item) =>
              item.name.toLowerCase().includes(keyword) &&
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
        open={isAddNewPermission}
        onClose={() => {
          setIsAddNewPermission(false);
        }}
        onSubmit={handleSubmit}
        allRoles={allRoles}
        setIsAddNewPermission={setIsAddNewPermission}
      />

      <EditPermission
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingPermission(null);
        }}
        editingPermission={editingPermission}
        allRoles={allRoles}
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

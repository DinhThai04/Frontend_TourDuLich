'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Collapse,
  Switch,
  Tag,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  message,
} from 'antd';
import { getPermissions } from '@/services/permissionService';
import { createRole } from '@/services/rolesServices';
import { isApiSuccess } from '@/utils/apiResult';

const { Text } = Typography;

interface Permission {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  enabled: boolean;
  id: number;
}

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

interface ModalAddNewRoleProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchRoles: () => void;
}

const ModalAddNewRole: React.FC<ModalAddNewRoleProps> = ({ open, setOpen, fetchRoles }) => {
  const [form] = Form.useForm<Pick<Role, 'name' | 'description' | 'active'>>();
  const [submitting, setSubmitting] = useState(false);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Dữ liệu mẫu nhóm quyền

  const togglePermission = (groupIndex: number, permIndex: number, checked: boolean) => {
    setDataPermissions((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? {
              ...g,
              permissions: g.permissions.map((p, pi) =>
                pi === permIndex ? { ...p, enabled: checked } : p
              ),
            }
          : g
      )
    );
  };
  const [dataPermissions, setDataPermissions] = useState<PermissionGroup[]>([]);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await getPermissions();

      if (isApiSuccess(response)) {
        const raw = response.result;

        // Group theo module
        const groups: Record<string, PermissionGroup> = {};

        raw.forEach((item) => {
          const group = groups[item.module] ?? (groups[item.module] = {
            name: item.module,
            permissions: [],
          });

          group.permissions.push({
            name: item.name,
            method: item.method,
            path: item.apiPath,
            enabled: false,
            id: item.id,
          });
        });

        // Convert object → array
        const formatted = Object.values(groups);

        setDataPermissions(formatted);
        setCatalogueLoaded(true);
      } else {
        message.error(response?.message || 'Lấy danh sách quyền thất bại');
      }
    } catch {
      message.error('Lấy danh sách quyền thất bại');
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    // Retry on each open so a failed first load does not silently create a role with no permissions.
    if (open) void fetchPermissions();
  }, [open]);

  // Closing after cancel or a successful save must clear both fields and permission switches.
  // Skip the first mount: the modal (and its Form) is not rendered yet, so resetFields would warn.
  const openedOnce = useRef(false);
  useEffect(() => {
    if (open) {
      openedOnce.current = true;
      return;
    }
    if (!openedOnce.current) return;
    form.resetFields();
    setDataPermissions((prev) =>
      prev.map((group) => ({
        ...group,
        permissions: group.permissions.map((permission) => ({ ...permission, enabled: false })),
      }))
    );
  }, [open, form]);

  // Lưu vai trò
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const activePermissions = dataPermissions.flatMap((g) =>
        g.permissions.filter((p) => p.enabled)
      );

      const dataRole = {
        name: values.name,
        description: values.description,
        active: values.active,
        permissions: activePermissions,
      };
      const res = await createRole(dataRole);
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Thêm vai trò thất bại');
      message.success('Thêm vai trò thành công');
      setOpen(false);
      form.resetFields();
      fetchRoles();
    } catch (error) {
      // Lỗi validate của AntD đã hiển thị tại field nên chỉ báo lỗi gọi API.
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm vai trò mới"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      width={800}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{ disabled: loadingPermissions || !catalogueLoaded }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={16} align="middle">
          {/* Tên vai trò */}
          <Col span={16}>
            <Form.Item
              label="Tên vai trò"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Nhập tên vai trò, ví dụ: Quản trị viên" />
            </Form.Item>
          </Col>

          {/* Trạng thái */}
          <Col span={8}>
            <Form.Item
              label="Trạng thái"
              name="active"
              valuePropName="checked"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ marginBottom: 0 }}
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea placeholder="Mô tả quyền hạn hoặc mục đích vai trò này" />
        </Form.Item>

        <Divider />
        <h4>Quyền hạn</h4>
        <Collapse
          accordion
          items={dataPermissions.map((group, gi) => {
            const allEnabled = group.permissions.every((p) => p.enabled);

            return {
              key: group.name,
              label: (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong>{group.name}</strong>

                  {/* 🔥 SWITCH MASTER */}
                  <Switch
                    checked={allEnabled}
                    onChange={(checked) => {
                      const newData = [...dataPermissions];
                      const group = newData[gi];
                      if (!group) return;
                      group.permissions = group.permissions.map((p) => ({
                        ...p,
                        enabled: checked,
                      }));
                      setDataPermissions(newData);
                    }}
                  />
                </div>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    {group.permissions.map((perm, pi) => (
                      <div
                        key={pi}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#fafafa',
                          borderRadius: 8,
                          padding: '8px 12px',
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <div>
                          <Text strong>{perm.name}</Text>
                          <div
                            style={{
                              fontSize: 14,
                              color: '#888',
                            }}
                          >
                            <Tag
                              color={
                                perm.method === 'GET'
                                  ? 'blue'
                                  : perm.method === 'POST'
                                    ? 'green'
                                    : perm.method === 'PUT'
                                      ? 'orange'
                                      : 'red'
                              }
                              style={{
                                marginRight: 8,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {perm.method}
                            </Tag>
                            {perm.path}
                          </div>
                        </div>

                        {/* 🔘 SWITCH CHILD */}
                        <Switch
                          checked={perm.enabled}
                          onChange={(checked) => togglePermission(gi, pi, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </Space>
              ),
            };
          })}
        />
      </Form>
    </Modal>
  );
};

export default ModalAddNewRole;

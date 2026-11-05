import type { PermissionOption } from '@/types/adminForms';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Space,
  Collapse,
  Divider,
  Typography,
  message,
} from 'antd';
import { toast } from 'react-toastify';
import { updateRole } from '@/services/rolesServices';
import { getPermissions } from '@/services/permissionService';
import { isApiSuccess } from '@/utils/apiResult';

const { Text } = Typography;

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  role: Role | null;
  fetchRoles: () => void;
}

const ModelEditRole: React.FC<Props> = ({ open, setOpen, role, fetchRoles }) => {
  const [form] = Form.useForm<Pick<Role, 'name' | 'description' | 'active'>>();

  // TOÀN BỘ QUYỀN TỪ API + ĐÁNH DẤU ENABLED THEO ROLE
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, PermissionOption[]>>({});
  // Saving is only safe once the catalogue is known; otherwise an empty list would wipe the role.
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // _________________________________________________
  // 1) LOAD TOÀN BỘ DANH SÁCH QUYỀN TỪ SERVER
  // _________________________________________________
  const fetchPermissions = async (): Promise<Record<string, PermissionOption[]> | null> => {
    try {
      const response = await getPermissions();

      if (isApiSuccess(response)) {
        const raw = response.result;

        const groups: Record<string, PermissionOption[]> = {};

        raw.forEach((item) => {
          const group = groups[item.module] ?? (groups[item.module] = []);

          group.push({
            id: item.id,
            name: item.name,
            method: item.method,
            apiPath: item.apiPath,
            enabled: false, // default
          });
        });

        return groups; // trả về dữ liệu dạng module
      }
      message.error(response?.message || 'Lấy danh sách quyền thất bại');
    } catch {
      message.error('Lấy danh sách quyền thất bại');
    }

    return null;
  };

  // _________________________________________________
  // 2) KHI ROLE THAY ĐỔI → GÁN GIÁ TRỊ FORM + PERMISSIONS ENABLED
  // _________________________________________________
  useEffect(() => {
    if (!role || !open) {
      setPermissionsByModule({});
      setCatalogueLoaded(false);
      setLoadingPermissions(false);
      return;
    }

    form.setFieldsValue({
      name: role.name,
      description: role.description,
      active: role.active,
    });
    // Never leave the previous role's toggles on screen while the new set loads.
    setPermissionsByModule({});
    setCatalogueLoaded(false);
    setLoadingPermissions(true);

    let cancelled = false;
    (async () => {
      const permGroups = await fetchPermissions();
      if (cancelled) return;
      setLoadingPermissions(false);
      if (!permGroups) return;

      // ĐÁNH DẤU enabled: true CHO QUYỀN ROLE ĐANG CÓ
      const grantedIds = new Set((role.permissions ?? []).map((p) => p.id));
      Object.keys(permGroups).forEach((moduleName) => {
        const list = permGroups[moduleName];
        if (!list) return;
        permGroups[moduleName] = list.map((p) => ({
          ...p,
          enabled: grantedIds.has(p.id),
        }));
      });

      setPermissionsByModule(permGroups);
      setCatalogueLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [role, form, open]);

  // _________________________________________________
  // 3) BẬT/TẮT TỪNG QUYỀN
  // _________________________________________________
  const togglePermission = (moduleName: string, permId: number, checked: boolean) => {
    const newData = { ...permissionsByModule };
    const list = newData[moduleName];
    if (!list) return;
    newData[moduleName] = list.map((p) =>
      p.id === permId ? { ...p, enabled: checked } : p
    );
    setPermissionsByModule(newData);
  };

  // _________________________________________________
  // 4) BẬT/TẮT NGUYÊN MODULE
  // _________________________________________________
  const toggleModule = (moduleName: string, checked: boolean) => {
    const newData = { ...permissionsByModule };
    const list = newData[moduleName];
    if (!list) return;
    newData[moduleName] = list.map((p) => ({
      ...p,
      enabled: checked,
    }));
    setPermissionsByModule(newData);
  };

  // _________________________________________________
  // 5) SUBMIT
  // _________________________________________________
  const handleSubmit = async () => {
    if (!role) return;
    // Same entry guard as the add-role modal: a second save while the first is in flight is never wanted.
    if (submitting) return;
    if (!catalogueLoaded) {
      toast.error('Chưa tải được danh sách quyền; chưa lưu để tránh xóa quyền hiện có.');
      return;
    }
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const activePermissions = Object.values(permissionsByModule)
        .flat()
        .filter((p) => p.enabled)
        .map((p) => ({
          id: p.id,
          name: p.name,
          method: p.method,
          apiPath: p.apiPath,
        }));

      const payload = {
        id: role.id,
        name: values.name,
        description: values.description,
        active: values.active,
        permissions: activePermissions,
      };

      const res = await updateRole(payload);
      if (!isApiSuccess(res)) throw new Error(res?.message || 'Cập nhật vai trò thất bại');
      toast.success('Cập nhật vai trò thành công!');
      setOpen(false);
      fetchRoles();
    } catch (error) {
      // Lỗi validate của AntD đã hiển thị tại field nên chỉ báo lỗi gọi API.
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // _________________________________________________
  // 6) UI RENDER
  // _________________________________________________
  return (
    <Modal
      title="Chỉnh sửa vai trò"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      width={900}
      okText="Lưu"
      confirmLoading={submitting}
      okButtonProps={{ disabled: loadingPermissions || !catalogueLoaded }}
      afterClose={() => {
        form.resetFields();
        setPermissionsByModule({});
        setCatalogueLoaded(false);
      }}
    >
      {loadingPermissions && (
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="Đang tải danh sách quyền..." />
      )}
      {!loadingPermissions && !catalogueLoaded && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chưa tải được danh sách quyền. Nút Lưu bị khóa để không vô tình xóa quyền của vai trò."
        />
      )}
      <Form layout="vertical" form={form}>
        <Form.Item label="Tên vai trò" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="active" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngưng" />
        </Form.Item>

        <Divider />
        <h4>Quyền hạn</h4>

        <Collapse
          accordion
          items={Object.keys(permissionsByModule).map((moduleName) => {
            const modulePerms = permissionsByModule[moduleName] ?? [];
            const allEnabled = modulePerms.every((p) => p.enabled);

            return {
              key: moduleName,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{moduleName}</strong>
                  <Switch checked={allEnabled} onChange={(c) => toggleModule(moduleName, c)} />
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
                    {modulePerms.map((perm) => (
                      <div
                        key={perm.id}
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
                          <div style={{ fontSize: 13, color: '#777' }}>
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
                              style={{ textTransform: 'uppercase', marginRight: 6 }}
                            >
                              {perm.method}
                            </Tag>
                            {perm.apiPath}
                          </div>
                        </div>

                        <Switch
                          checked={perm.enabled}
                          onChange={(checked) => togglePermission(moduleName, perm.id, checked)}
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

export default ModelEditRole;

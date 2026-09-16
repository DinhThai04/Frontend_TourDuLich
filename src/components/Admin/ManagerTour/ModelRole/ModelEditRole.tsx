import React, { useEffect, useState } from 'react';
import {
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

const { Panel } = Collapse;
const { Text } = Typography;

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  role: any;
  fetchRoles: () => void;
}

const ModelEditRole: React.FC<Props> = ({ open, setOpen, role, fetchRoles }) => {
  const [form] = Form.useForm();

  // TOÀN BỘ QUYỀN TỪ API + ĐÁNH DẤU ENABLED THEO ROLE
  const [permissionsByModule, setPermissionsByModule] = useState<any>({});

  // _________________________________________________
  // 1) LOAD TOÀN BỘ DANH SÁCH QUYỀN TỪ SERVER
  // _________________________________________________
  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();

      if (response.code === 200) {
        const raw = response.result;

        const groups: Record<string, any[]> = {};

        raw.forEach((item: any) => {
          if (!groups[item.module]) groups[item.module] = [];

          groups[item.module].push({
            id: item.id,
            name: item.name,
            method: item.method,
            apiPath: item.apiPath,
            enabled: false, // default
          });
        });

        return groups; // trả về dữ liệu dạng module
      }
    } catch (error) {
      console.error(error);
      message.error('Lấy danh sách quyền thất bại');
    }

    return {};
  };

  // _________________________________________________
  // 2) KHI ROLE THAY ĐỔI → GÁN GIÁ TRỊ FORM + PERMISSIONS ENABLED
  // _________________________________________________
  useEffect(() => {
    if (!role) return;

    form.setFieldsValue({
      name: role.name,
      description: role.description,
      active: role.active,
    });

    (async () => {
      const permGroups = await fetchPermissions();

      // ĐÁNH DẤU enabled: true CHO QUYỀN ROLE ĐANG CÓ
      const grantedIds = role.permissions.map((p: any) => p.id);
      Object.keys(permGroups).forEach((moduleName) => {
        permGroups[moduleName] = permGroups[moduleName].map((p: any) => ({
          ...p,
          enabled: grantedIds.includes(p.id),
        }));
      });

      setPermissionsByModule(permGroups);
    })();
  }, [role]);

  // _________________________________________________
  // 3) BẬT/TẮT TỪNG QUYỀN
  // _________________________________________________
  const togglePermission = (moduleName: string, permId: number, checked: boolean) => {
    const newData = { ...permissionsByModule };
    newData[moduleName] = newData[moduleName].map((p: any) =>
      p.id === permId ? { ...p, enabled: checked } : p
    );
    setPermissionsByModule(newData);
  };

  // _________________________________________________
  // 4) BẬT/TẮT NGUYÊN MODULE
  // _________________________________________________
  const toggleModule = (moduleName: string, checked: boolean) => {
    const newData = { ...permissionsByModule };
    newData[moduleName] = newData[moduleName].map((p: any) => ({
      ...p,
      enabled: checked,
    }));
    setPermissionsByModule(newData);
  };

  // _________________________________________________
  // 5) SUBMIT
  // _________________________________________________
  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      const activePermissions = Object.values(permissionsByModule)
        .flat()
        .filter((p: any) => p.enabled)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          method: p.method,
          apiPath: p.apiPath,
        }));

      const payload = {
        id: role?.id,
        name: values.name,
        description: values.description,
        active: values.active,
        permissions: activePermissions,
      };

      try {
        const res = await updateRole(payload);
        if (res.code === 200 || res.code === 201) {
          toast.success('Cập nhật vai trò thành công!');
          setOpen(false);
          fetchRoles();
        }
      } catch (e) {
        console.error(e);
        toast.error('Cập nhật vai trò thất bại');
      }
    });
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
    >
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

        <Collapse accordion>
          {Object.keys(permissionsByModule).map((moduleName) => {
            const modulePerms = permissionsByModule[moduleName];
            const allEnabled = modulePerms.every((p: any) => p.enabled);

            return (
              <Panel
                key={moduleName}
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{moduleName}</strong>
                    <Switch checked={allEnabled} onChange={(c) => toggleModule(moduleName, c)} />
                  </div>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    {modulePerms.map((perm: any) => (
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
              </Panel>
            );
          })}
        </Collapse>
      </Form>
    </Modal>
  );
};

export default ModelEditRole;

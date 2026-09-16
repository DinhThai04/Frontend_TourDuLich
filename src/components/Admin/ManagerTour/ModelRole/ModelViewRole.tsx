import React from 'react';
import { Modal, Tag, Collapse, Space, Divider, Typography, Switch } from 'antd';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  role: any;
}

const ModelViewRole: React.FC<Props> = ({ open, setOpen, role }) => {
  if (!role) return null;

  // Nhóm quyền theo module
  const permissionsByModule = role.permissions?.reduce((acc: any, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <Modal
      title="Chi tiết vai trò"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 4 }}>
          {role.name}
        </Title>

        <Text type="secondary">{role.description || 'Không có mô tả'}</Text>

        <div style={{ marginTop: 8 }}>
          <Tag color={role.active ? 'green' : 'red'}>
            {role.active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
          </Tag>
        </div>
      </div>

      <Divider />

      <h3>Danh sách quyền</h3>

      {!role.permissions || role.permissions.length === 0 ? (
        <Text type="secondary">• Vai trò này chưa được gán quyền nào</Text>
      ) : (
        <Collapse accordion>
          {Object.keys(permissionsByModule).map((moduleName) => {
            const perms = permissionsByModule[moduleName];

            return (
              <Panel
                key={moduleName}
                header={<div style={{ fontWeight: 600, fontSize: 15 }}>{moduleName}</div>}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {perms.map((perm: any) => (
                    <div
                      key={perm.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <div>
                        <Text strong>{perm.name}</Text>
                        <div style={{ fontSize: 13, color: '#888' }}>
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

                      {/* Chỉ xem, không chỉnh sửa */}
                      <Switch checked={true} disabled />
                    </div>
                  ))}
                </Space>
              </Panel>
            );
          })}
        </Collapse>
      )}
    </Modal>
  );
};

export default ModelViewRole;

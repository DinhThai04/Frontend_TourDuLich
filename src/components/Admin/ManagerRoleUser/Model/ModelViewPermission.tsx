import React from 'react';
import { Modal, Descriptions, Tag, Typography } from 'antd';

const { Text } = Typography;

interface Permission {
  id: number;
  code: string;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  viewingPermission?: Permission | null;
}

const methodColorMap: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'purple',
  DELETE: 'red',
};

const ModelViewPermission: React.FC<Props> = ({ open, onClose, viewingPermission }) => {
  return (
    <Modal
      title="Chi tiết quyền"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
      maskClosable={false}
      styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' } }}
    >
      {!viewingPermission ? (
        <Text type="secondary">Không có dữ liệu quyền để hiển thị.</Text>
      ) : (
        <Descriptions
          bordered
          column={1}
          styles={{ label: { width: 160, fontWeight: 500 }, content: { background: '#fafafa' } }}
        >
          <Descriptions.Item label="Tên quyền">
            <Text strong>{viewingPermission.name}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Mã quyền">
            <Text code>{viewingPermission.code}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Module">
            <Tag color="processing">{viewingPermission.module}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="API Path">
            <Text code>{viewingPermission.apiPath}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Method">
            <Tag color={methodColorMap[viewingPermission.method] || 'default'}>
              {viewingPermission.method}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="ID">
            <Text type="secondary">{viewingPermission.id}</Text>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default ModelViewPermission;

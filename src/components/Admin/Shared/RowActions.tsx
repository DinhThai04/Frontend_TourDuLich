import { Button, Dropdown, Space } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Action = { key: string; label: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean };
export default function RowActions({ subject, href, onDetails, items = [] }: {
  subject: string; href?: string; onDetails?: () => void; items?: Action[];
}) {
  const single = items.length === 1 ? items[0] : undefined;
  return <Space size={6}>
    {href ? <Link className="ant-btn ant-btn-default admin-row-detail" to={href}>Chi tiết</Link>
      : onDetails && <Button className="admin-row-detail" onClick={onDetails}>Chi tiết</Button>}
    {single && <Button className="admin-row-detail" disabled={single.disabled} danger={single.danger} onClick={single.onClick}>{single.label}</Button>}
    {items.length >= 2 && <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" rootClassName="admin-row-menu" getPopupContainer={trigger => trigger.ownerDocument.body} align={{ offset: [0, 4] }}>
      <Button type="text" size="small" aria-label={`Thao tác ${subject}`} icon={<MoreOutlined />} title={`Thao tác ${subject}`} />
    </Dropdown>}
  </Space>;
}

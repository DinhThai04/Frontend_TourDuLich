import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import AdminPageHeader from '@/components/Admin/Shared/AdminPageHeader';
import ManagerRole from '@/components/Admin/ManagerTour/ManagerRole';
import ManagerRoleUser from '@/components/Admin/ManagerRoleUser/ManagerRoleUser';

export default function AuthorizationPage() {
  const roles = useHasPermission(P.ROLES.GET_LIST);
  const permissions = useHasPermission(P.PERMISSIONS.GET_LIST);
  const [query, setQuery] = useSearchParams();
  const active = permissions && (query.get('tab') === 'permissions' || !roles) ? 'permissions' : 'roles';
  return <div className="admin-dashboard">
    <AdminPageHeader title="Phân quyền" description="Quản lý vai trò và các quyền được gán cho từng vai trò." />
    <Tabs activeKey={active} destroyOnHidden onChange={tab => setQuery({ tab })} items={[
      ...(roles ? [{ key: 'roles', label: 'Vai trò', children: <ManagerRole embedded /> }] : []),
      ...(permissions ? [{ key: 'permissions', label: 'Quyền hạn', children: <ManagerRoleUser embedded /> }] : []),
    ]} />
  </div>;
}

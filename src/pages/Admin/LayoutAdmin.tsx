import { hasPermission, OPERATIONS_ACCESS } from '@/config/access';
import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserOutlined,
  ScheduleOutlined,
  StarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  FileTextOutlined,
  SwapOutlined,
  TagsOutlined,
  InboxOutlined,
  CompassOutlined,
  FieldTimeOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Grid, Layout, Drawer, Divider, Dropdown, Avatar, Button, message } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { logoutUser } from '@/store/slices/authSlice';
import brandIcon from '@/assets/branding/sgu-tour-icon.svg';
import { Bounce, ToastContainer } from 'react-toastify';


export type AdminTourBreadcrumb = { id: number; name: string; tab: string };
const AdminQuickSearch = lazy(() => import('./AdminQuickSearch'));
const AdminNotifications = lazy(() => import('./AdminNotifications'));


const pageTitles: Record<string, string> = {
  '/admin/operations': 'Tổng quan',
  '/admin/authorization': 'Phân quyền',
  '/admin/tours': 'Tour',
  '/admin/departures': 'Lịch khởi hành',
  '/admin/inbox': 'Hộp công việc',
  '/admin/audit': 'Nhật ký quản trị',
  '/admin/managerUser': 'Người dùng',
  '/admin/managerBooking': 'Đặt chỗ',
  '/admin/managerInvoice': 'Hóa đơn',
  '/admin/paymentReconciliation': 'Đối soát',
  '/admin/managerRole': 'Quyền hạn',
  '/admin/role': 'Vai trò',
  '/admin/managerTour/list': 'Danh sách tour',
  '/admin/managerTour/tourDeparture': 'Lịch khởi hành',
  '/admin/managerTour/price': 'Bảng giá',
  '/admin/managerTour/destination': 'Địa điểm',
  '/admin/managerTour/reviews': 'Đánh giá',
  '/admin/managerTour/itinerary': 'Lịch trình',
};

const AdminSidebar: React.FC = () => {
  const [tourBreadcrumb, setTourBreadcrumb] = useState<AdminTourBreadcrumb>();
  const [inboxLabel, setInboxLabel] = useState('');
  const updateInboxLabel = useCallback((count: number, partial: boolean) => {
    setInboxLabel(count ? `${count}${partial ? '+' : ''}` : '');
  }, []);
  const desktop = Grid.useBreakpoint().lg;
  const [manualOpen, setManualOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const collapsed = !manualOpen && !hoverOpen;

  function cancelHoverTimer() {
    window.clearTimeout(hoverTimer.current);
  }

  function scheduleHover(open: boolean) {
    cancelHoverTimer();
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    hoverTimer.current = window.setTimeout(() => setHoverOpen(open), open ? 200 : 320);
  }

  useEffect(() => {
    if (!desktop) setHoverOpen(false);
    return cancelHoverTimer;
  }, [desktop]);

  function toggleSidebar() {
    if (!desktop) {
      setMobileOpen(value => !value);
      return;
    }
    cancelHoverTimer();
    setManualOpen(collapsed);
    setHoverOpen(false);
  }
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  // Xây menu theo đúng quyền mà từng route yêu cầu, tránh hiện mục rồi bị chặn khi bấm.
  const menuItems: MenuProps['items'] = [];

  if (hasPermission(user, OPERATIONS_ACCESS)) {
    menuItems.push({
      key: '/admin/operations',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/operations">Tổng quan vận hành</Link>,
    });
  }

  // Quản lý người dùng (module USERS)
  if (hasPermission(user, ALL_PERMISSIONS.USERS.GET_LIST)) {
    menuItems.push({
      key: '/admin/managerUser',
      icon: <UserOutlined />,
      label: <Link to="/admin/managerUser">Quản lý người dùng</Link>,
    });
  }

  // ================== QUẢN LÝ TOUR DU LỊCH ==================
  const tourChildren: MenuProps['items'] = [];

  // Danh sách tour
  if (hasPermission(user, ALL_PERMISSIONS.TOURS.GET_LIST)) {
    tourChildren.push({
      key: '/admin/managerTour/list',
      icon: <CompassOutlined />,
      label: <Link to="/admin/tours">Danh sách tour</Link>,
    });

  }

  // Ngày khởi hành
  if (hasPermission(user, ALL_PERMISSIONS.TOUR_DEPARTURES.GET_LIST)) {
    tourChildren.push({
      key: '/admin/departures',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/departures">Ngày khởi hành</Link>,
    });
  }

  // Địa điểm
  if (hasPermission(user, ALL_PERMISSIONS.LOCATIONS.GET_DESTINATIONS)) {
    tourChildren.push({
      key: '/admin/managerTour/destination',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/managerTour/destination">Điểm đến</Link>,
    });
  }

  if (hasPermission(user, ALL_PERMISSIONS.PRICE.GET_LIST)) {
    tourChildren.push({
      key: '/admin/managerTour/price',
      icon: <TagsOutlined />,
      label: <Link to="/admin/managerTour/price">Bảng giá</Link>,
    });
  }

  // Đánh giá tour
  if (hasPermission(user, ALL_PERMISSIONS.REVIEWS.GET_LIST)) {
    tourChildren.push({
      key: '/admin/managerTour/reviews',
      icon: <StarOutlined />,
      label: <Link to="/admin/managerTour/reviews">Đánh giá tour</Link>,
    });
  }

  // ================== BOOKING / HÓA ĐƠN ==================
  if (hasPermission(user, ALL_PERMISSIONS.BOOKINGS.GET_ALL)) {
    menuItems.push({
      key: '/admin/managerBooking',
      icon: <ScheduleOutlined />,
      label: <Link to="/admin/managerBooking">Quản lý đặt chỗ</Link>,
    });

  }
  if (hasPermission(user, ALL_PERMISSIONS.INVOICES.GET_ALL)) {
    menuItems.push({
      key: '/admin/managerInvoice',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/managerInvoice">Quản lý hóa đơn</Link>,
    });
  }

  // Quyền hạn (PERMISSIONS)
  if (hasPermission(user, ALL_PERMISSIONS.PAYMENT_RECONCILIATION.GET_LIST)) {
    menuItems.push({ key: '/admin/paymentReconciliation', icon: <SwapOutlined />,
      label: <Link to="/admin/paymentReconciliation">Đối soát thanh toán</Link> });
  }

  if (hasPermission(user, { anyOf: [ALL_PERMISSIONS.ROLES.GET_LIST.code, ALL_PERMISSIONS.PERMISSIONS.GET_LIST.code] })) {
    menuItems.push({ key: '/admin/authorization', icon: <SafetyOutlined />,
      label: <Link to="/admin/authorization">Phân quyền</Link> });
  }

  if (hasPermission(user, OPERATIONS_ACCESS)) {
    menuItems.push({ key: '/admin/inbox', icon: <InboxOutlined />, label: <Link to="/admin/inbox">Hộp công việc {inboxLabel && <small className="admin-inbox-count">{inboxLabel}</small>}</Link> });
    menuItems.push({ key: '/admin/audit', icon: <FieldTimeOutlined />, label: <Link to="/admin/audit">Nhật ký quản trị</Link> });
  }
  const accounts = new Set(['/admin/managerUser', '/admin/authorization', '/admin/audit']);
  const overview = new Set(['/admin/operations', '/admin/inbox']);
  const groups = [
    { key: 'overview', label: 'Tổng quan', children: menuItems.filter(item => overview.has(String(item?.key))) },
    { key: 'operations', label: 'Vận hành', children: menuItems.filter(item => item && item.key === '/admin/managerBooking') },
    { key: 'tour', label: 'Tour', children: tourChildren },
    { key: 'finance', label: 'Tài chính', children: menuItems.filter(item => item?.key === '/admin/paymentReconciliation' || item?.key === '/admin/managerInvoice') },
    { key: 'access', label: 'Hệ thống', children: menuItems.filter(item => item && accounts.has(String(item.key))) },
  ].filter(group => group.children.length).map(group => ({ ...group, type: 'group' as const }));

  // Dropdown account
  const activeTourBreadcrumb = tourBreadcrumb && new RegExp(`^/admin/tours/${tourBreadcrumb.id}(?:/|$)`).test(location.pathname)
    ? tourBreadcrumb : undefined;
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const input = document.querySelector<HTMLInputElement>('.admin-content input[aria-label^="Tìm"], .admin-content .admin-lookup input');
      if (input) { event.preventDefault(); input.focus(); }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  const currentMenu = location.pathname.startsWith('/admin/tours') ? '/admin/managerTour/list'
    : ['/admin/role', '/admin/managerRole'].includes(location.pathname) ? '/admin/authorization' : location.pathname;
  const itemsDropdown: MenuProps['items'] = [
    {
      key: 'home',
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      onClick: async () => {
        const result = await dispatch(logoutUser());
        navigate('/login');
        if (logoutUser.rejected.match(result)) message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
        else message.success('Đăng xuất thành công');
      },
    },
  ];

  const sidebar = (compact: boolean) => <div className="admin-sidebar">
    <Link to="/admin" className="admin-sidebar-brand" aria-label="Trang quản trị SGU Tour" onClick={() => setMobileOpen(false)}>
      <img className="admin-brand-symbol" src={brandIcon} alt="" />
      <span className="admin-brand-label"><strong>SGU Tour</strong><small>Điều hành tour</small></span>
    </Link>
    <nav className="admin-sidebar-scroll" aria-label="Menu quản trị">
      {groups.map(group => <div key={group.key}>
        <div className="admin-nav-heading">{compact ? <Divider /> : group.label}</div>
        {group.children.map(item => {
          if (!item || !('icon' in item) || !('label' in item) || !React.isValidElement<{ to: string; children: React.ReactNode }>(item.label)) return null;
          const active = currentMenu === item.key;
          return <Link key={item.key} to={item.label.props.to} onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`admin-nav-link${active ? ' active' : ''}`}>
              <span className="admin-nav-icon">{item.icon}</span><span className="admin-nav-text">{item.label.props.children}</span>
            </Link>;
        })}
      </div>)}
    </nav>
    <div className="admin-sidebar-footer">
      <Link to="/" className="admin-nav-link"><span className="admin-nav-icon"><SwapOutlined /></span><span className="admin-nav-text">Về trang khách hàng</span></Link>
    </div>
  </div>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false}
        newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss draggable
        pauseOnHover theme="light" transition={Bounce} />
    <Layout className={`admin-shell admin-workspace${desktop && !collapsed ? ' admin-shell-expanded' : ''}`}>
      {desktop ? <div className="admin-sidebar-slot"><Layout.Sider width={264} collapsedWidth={72} trigger={null} collapsed={collapsed} className="admin-push-sider"
        onMouseEnter={() => scheduleHover(true)} onMouseLeave={() => scheduleHover(false)}>
        {sidebar(collapsed)}
        {!collapsed && <Button type="text" className="admin-sidebar-close" aria-label="Đóng menu quản trị"
          aria-expanded icon={<MenuFoldOutlined />} onClick={toggleSidebar} />}
      </Layout.Sider></div> : <Drawer title="Menu quản trị" placement="left" width={264} open={mobileOpen}
        onClose={() => setMobileOpen(false)} styles={{ body: { padding: 0 } }}>
        {sidebar(false)}
      </Drawer>}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-leading">
          <Button type="text" className={`admin-header-toggle${desktop && !collapsed ? ' admin-toggle-covered' : ''}`}
            aria-label={!desktop && mobileOpen ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
            aria-expanded={desktop ? !collapsed : mobileOpen}
            icon={<MenuUnfoldOutlined />}
            onClick={toggleSidebar} />
          <nav aria-label="Vị trí hiện tại" className="admin-breadcrumb">
            {activeTourBreadcrumb ? <>
              <Link to="/admin/tours">Tour</Link><span aria-hidden="true">›</span>
              <Link to={`/admin/tours/${activeTourBreadcrumb.id}`}>{activeTourBreadcrumb.name}</Link><span aria-hidden="true">›</span>
              <strong aria-current="page">{activeTourBreadcrumb.tab}</strong>
            </> : <>
              <Link to="/admin">Quản trị</Link><span aria-hidden="true">/</span>
              <strong aria-current="page">{pageTitles[location.pathname] || 'SGU Tour'}</strong>
            </>}
          </nav>
          </div>
          <div className="admin-top-actions">
          <Suspense fallback={null}><AdminQuickSearch /><AdminNotifications onCount={updateInboxLabel} /></Suspense>
          <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
            <Button type="text" className="admin-header-account">
              <Avatar size={32} style={{ backgroundColor: '#21776d' }}>{(user?.username || 'A')[0]?.toUpperCase()}</Avatar>
              <span className="hidden sm:inline">{user?.username || 'Admin'}</span>
            </Button>
          </Dropdown>
          </div>
        </header>
        <main className="admin-content"><Outlet context={setTourBreadcrumb} /></main>
      </div>
    </Layout>
    </>
  );
};

export default AdminSidebar;

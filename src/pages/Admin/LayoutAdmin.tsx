import { hasPermission, OPERATIONS_ACCESS } from '@/config/access';
import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
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
import { Menu, Dropdown, Avatar, Button, message } from 'antd';
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

const SIDEBAR_OPEN_DELAY = 200;
const SIDEBAR_CLOSE_DELAY = 320;

const pageTitles: Record<string, string> = {
  '/admin/operations': 'Tổng quan',
  '/admin/authorization': 'Phân quyền',
  '/admin/tours': 'Tour',
  '/admin/departures': 'Lịch khởi hành',
  '/admin/inbox': 'Hộp công việc',
  '/admin/audit': 'Nhật ký hoạt động',
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
  const [hovered, setHovered] = useState(false);
  const [manual, setManual] = useState(false);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1536px)').matches);
  const [pinPreference, setPinPreference] = useState(() => typeof window !== 'undefined' && localStorage.getItem('sgu-admin-pinned') === '1');
  const pinned = wide && pinPreference;
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [flyouts, setFlyouts] = useState<string[]>([]);
  const collapsed = !hovered && !manual && !pinned;
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1536px)');
    const change = () => setWide(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setManual(false); setHovered(false); setFlyouts([]);
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.admin-rail, .admin-header-toggle, .admin-tour-flyout')) {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setHovered(false); setManual(false);
      }
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', outside);
    };
  }, []);

  const cancelHoverTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  const scheduleHover = (open: boolean) => {
    cancelHoverTimer();
    if (pinned || manual || hovered === open || (open && !window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)').matches)) return;
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      setFlyouts([]);
      setHovered(open);
    }, open ? SIDEBAR_OPEN_DELAY : SIDEBAR_CLOSE_DELAY);
  };

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
    menuItems.push({ key: '/admin/audit', icon: <FieldTimeOutlined />, label: <Link to="/admin/audit">Nhật ký hoạt động</Link> });
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

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false}
        newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss draggable
        pauseOnHover theme="light" transition={Bounce} />
    <div className={`admin-shell${collapsed ? '' : ' admin-shell-expanded'}${pinned ? ' admin-shell-pinned' : ''}`}>
      <aside className="admin-rail" onMouseEnter={() => scheduleHover(true)} onMouseLeave={() => scheduleHover(false)}
        aria-label="Menu quản trị">
        <div className="admin-sidebar">
          <Link to="/admin" className="admin-sidebar-brand" aria-label="Trang quản trị SGU Tour">
            <img className="admin-brand-symbol" src={brandIcon} alt="" />
            <span className="admin-brand-label"><strong>SGU Tour</strong><small>Điều hành tour</small></span>
          </Link>
          <Menu theme="dark" selectedKeys={[currentMenu]} mode="inline" inlineCollapsed={collapsed}
            openKeys={collapsed ? flyouts : openGroups} onOpenChange={collapsed ? setFlyouts : setOpenGroups} onClick={() => { setManual(false); setHovered(false); }} items={groups} />
          {!collapsed && <div className="admin-sidebar-footer"><Link to="/">Về trang khách hàng</Link></div>}
        </div>
      </aside>
      {manual && !pinned && <button tabIndex={-1} aria-label="Đóng menu" className="admin-sidebar-dismiss"
        onClick={() => { cancelHoverTimer(); setManual(false); setHovered(false); setFlyouts([]); }} />}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-leading">
          <Button type="text" className="admin-header-toggle" aria-label={collapsed ? 'Mở menu quản trị' : 'Đóng menu quản trị'}
            aria-expanded={!collapsed} disabled={pinned} title={pinned ? 'Thu gọn menu' : 'Mở rộng menu'}
            icon={pinned ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => { cancelHoverTimer(); setFlyouts([]); setManual(collapsed); setHovered(false); }} />
          {wide && <Button type="text" size="small" aria-pressed={pinned} onClick={() => {
            localStorage.setItem('sgu-admin-pinned', pinned ? '0' : '1');
            setPinPreference(!pinned); setManual(false); setHovered(false);
          }}>{pinned ? 'Bỏ ghim' : 'Ghim menu'}</Button>}
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
    </div>
    </>
  );
};

export default AdminSidebar;

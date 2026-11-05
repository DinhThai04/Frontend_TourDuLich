import { hasPermission } from '@/config/access';
import React, { useState, useEffect } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  GlobalOutlined,
  ScheduleOutlined,
  StarOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  GiftOutlined,
  FieldTimeOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, Avatar, Button, message } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { logoutUser } from '@/store/slices/authSlice';
import brand from '@/assets/branding/sgu-tour-header.svg';
import brandIcon from '@/assets/branding/sgu-tour-icon.svg';
import { Bounce, ToastContainer } from 'react-toastify';

const { Content, Sider } = Layout;

const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('/admin');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setActiveMenu(location.pathname || '/admin');
  }, [location.pathname]);

  // Xây menu theo đúng quyền mà từng route yêu cầu, tránh hiện mục rồi bị chặn khi bấm.
  const menuItems: MenuProps['items'] = [];

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
      icon: <UnorderedListOutlined />,
      label: <Link to="/admin/managerTour/list">Danh sách tour</Link>,
    });

  }

  if (hasPermission(user, ALL_PERMISSIONS.PRICE.GET_LIST)) {
    tourChildren.push({
      key: '/admin/managerTour/price',
      icon: <MoneyCollectOutlined />,
      label: <Link to="/admin/managerTour/price">Giá</Link>,
    });
  }

  // Ngày khởi hành
  if (hasPermission(user, ALL_PERMISSIONS.TOUR_DEPARTURES.GET_LIST)) {
    tourChildren.push({
      key: '/admin/managerTour/tourDeparture',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/managerTour/tourDeparture">Ngày khởi hành</Link>,
    });
  }

  // Lịch trình
  if (hasPermission(user, ALL_PERMISSIONS.ITINERARIES.GET_BY_TOUR)) {
    tourChildren.push({
      key: '/admin/managerTour/itinerary',
      icon: <FieldTimeOutlined />,
      label: <Link to="/admin/managerTour/itinerary">Lịch trình</Link>,
    });
  }

  // Địa điểm
  if (hasPermission(user, ALL_PERMISSIONS.LOCATIONS.GET_DESTINATIONS)) {
    tourChildren.push({
      key: '/admin/managerTour/destination',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/managerTour/destination">Địa điểm</Link>,
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

  // Chỉ push group "Quản lý tour du lịch" nếu có ít nhất 1 mục con
  if (tourChildren.length > 0) {
    menuItems.push({
      key: '/admin/managerTour',
      icon: <GlobalOutlined />,
      label: 'Quản lý tour du lịch',
      children: tourChildren,
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
      icon: <GiftOutlined />,
      label: <Link to="/admin/managerInvoice">Quản lý hóa đơn</Link>,
    });
  }

  // Quản lý quyền hạn (PERMISSIONS)
  if (hasPermission(user, ALL_PERMISSIONS.PAYMENT_RECONCILIATION.GET_LIST)) {
    menuItems.push({ key: '/admin/paymentReconciliation', icon: <MoneyCollectOutlined />,
      label: <Link to="/admin/paymentReconciliation">Đối soát thanh toán</Link> });
  }

  // Quản lý quyền hạn (PERMISSIONS)
  if (hasPermission(user, ALL_PERMISSIONS.PERMISSIONS.GET_LIST)) {
    menuItems.push({
      key: '/admin/managerRole',
      icon: <UsergroupAddOutlined />,
      label: <Link to="/admin/managerRole">Quản lý quyền hạn</Link>,
    });
  }

  // Quản lý vai trò (ROLES)
  if (hasPermission(user, ALL_PERMISSIONS.ROLES.GET_LIST)) {
    menuItems.push({
      key: '/admin/role',
      icon: <SafetyOutlined />,
      label: <Link to="/admin/role">Quản lý vai trò</Link>,
    });
  }

  // Dropdown account
  const itemsDropdown: MenuProps['items'] = [
    {
      key: 'home',
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: 'logout',
      label: (
        <Button
          type="text"
          style={{ cursor: 'pointer', right: 15 }}
          onClick={async () => {
            const result = await dispatch(logoutUser());
            navigate('/login');
            // The local session is always cleared; warn only when the server did not revoke the tokens.
            if (logoutUser.rejected.match(result)) message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
            else message.success('Đăng xuất thành công');
          }}
        >
          Đăng xuất
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', position: 'relative' }}>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false}
        newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss draggable
        pauseOnHover theme="light" transition={Bounce} />
      {/* Sidebar */}
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        collapsedWidth={80}
      >
        <div
          style={{
            height: 56,
            margin: 16,
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#1890ff',
          }}
        >
          <Link to="/" aria-label="Trang chủ SGU Tour" title="Hệ thống quản trị SGU Tour" style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <img src={collapsed ? brandIcon : brand} alt="SGU Tour" style={{ display: 'block', width: collapsed ? 40 : 190, maxWidth: '100%', height: 'auto', maxHeight: 56 }} />
          </Link>
        </div>
        <Menu
          selectedKeys={[activeMenu]}
          mode="inline"
          items={menuItems}
          onClick={(e) => setActiveMenu(e.key)}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginRight: 20,
            padding: '0 1rem',
            alignItems: 'center',
            height: 64,
            background: '#fff',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              Welcome {user?.username || 'Admin'} <Avatar>{(user?.username || 'A')[0]}</Avatar>
            </Space>
          </Dropdown>
        </div>

        {/* Nội dung */}
        <Content
          style={{
            padding: '1rem',
            overflow: 'hidden',
            height: 'calc(100vh - 64px)',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              overflowY: 'auto',
              paddingRight: 0,
              position: 'relative',
            }}
            className="custom-scrollbar"
          >
            <style>
              {`
                .custom-scrollbar {
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                  display: none !important;
                  width: 0 !important;
                  height: 0 !important;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                  display: none !important;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                  display: none !important;
                }

                .ant-modal-wrap {
                  overflow: auto !important;
                }

                .ant-modal-mask {
                  position: fixed !important;
                  background-color: rgba(0, 0, 0, 0.5) !important;
                }

                .ant-modal {
                  position: fixed !important;
                }

                body.ant-scrolling-effect {
                  overflow: auto !important;
                  padding-right: 0 !important;
                }

                .ant-modal-open {
                  overflow: auto !important;
                }
              `}
            </style>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminSidebar;

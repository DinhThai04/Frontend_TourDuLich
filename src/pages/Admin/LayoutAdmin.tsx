import React, { useState, useEffect, useMemo } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
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

  const permissions = user?.role?.permissions || [];
  const isAdmin = user?.role?.name === 'ADMIN';

  // Tạo Set permission từ role (giả sử backend trả về method + apiPath)
  const userPermissionSet = useMemo(() => {
    return new Set(permissions.map((p: any) => `${p.method?.toUpperCase()}:${p.apiPath}`));
  }, [permissions]);

  // Lấy list permission theo module (hoặc nhiều module)
  const getPermissionListByModules = (modules: string | string[]) => {
    const moduleArr = Array.isArray(modules) ? modules : [modules];
    const list: { method: string; apiPath: string }[] = [];

    moduleArr.forEach((m) => {
      const modulePerms = (ALL_PERMISSIONS as any)[m];
      if (modulePerms) {
        Object.values(modulePerms).forEach((perm: any) => {
          list.push({ method: perm.method, apiPath: perm.apiPath });
        });
      }
    });

    return list;
  };

  // Check xem user có quyền với 1 hoặc nhiều module không
  const hasPermissionForModules = (modules: string | string[]) => {
    if (isAdmin) return true; // ADMIN full quyền

    const perms = getPermissionListByModules(modules);
    return perms.some((perm) =>
      userPermissionSet.has(`${perm.method?.toUpperCase()}:${perm.apiPath}`)
    );
  };

  // Xây menu theo quyền
  // Xây menu theo quyền
  const menuItems: MenuProps['items'] = [];

  // Quản lý người dùng (module USERS)
  if (hasPermissionForModules('USERS')) {
    menuItems.push({
      key: '/admin/managerUser',
      icon: <UserOutlined />,
      label: <Link to="/admin/managerUser">Quản lý người dùng</Link>,
    });
  }

  // ================== QUẢN LÝ TOUR DU LỊCH ==================
  const tourChildren: MenuProps['items'] = [];

  // Danh sách tour
  if (hasPermissionForModules('TOURS')) {
    tourChildren.push({
      key: '/admin/managerTour/list',
      icon: <UnorderedListOutlined />,
      label: <Link to="/admin/managerTour/list">Danh sách tour</Link>,
    });

    // Nếu bạn muốn mục "Giá" cũng thuộc module TOURS:
    tourChildren.push({
      key: '/admin/managerTour/price',
      icon: <MoneyCollectOutlined />,
      label: <Link to="/admin/managerTour/price">Giá</Link>,
    });
  }

  // Ngày khởi hành
  if (hasPermissionForModules('TOUR_DEPARTURES')) {
    tourChildren.push({
      key: '/admin/managerTour/tourDeparture',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/managerTour/tourDeparture">Ngày khởi hành</Link>,
    });
  }

  // Lịch trình
  if (hasPermissionForModules('ITINERARIES')) {
    tourChildren.push({
      key: '/admin/managerTour/itinerary',
      icon: <FieldTimeOutlined />,
      label: <Link to="/admin/managerTour/itinerary">Lịch trình</Link>,
    });
  }

  // Địa điểm
  if (hasPermissionForModules('LOCATIONS')) {
    tourChildren.push({
      key: '/admin/managerTour/destination',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/managerTour/destination">Địa điểm</Link>,
    });
  }

  // Đánh giá tour
  if (hasPermissionForModules('REVIEWS')) {
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
  if (hasPermissionForModules('BOOKINGS')) {
    menuItems.push({
      key: '/admin/managerBooking',
      icon: <ScheduleOutlined />,
      label: <Link to="/admin/managerBooking">Quản lý đặt chỗ</Link>,
    });

    menuItems.push({
      key: '/admin/managerInvoice',
      icon: <GiftOutlined />,
      label: <Link to="/admin/managerInvoice">Quản lý hóa đơn</Link>,
    });
  }

  // Quản lý quyền hạn (PERMISSIONS)
  if (hasPermissionForModules('PERMISSIONS')) {
    menuItems.push({
      key: '/admin/managerRole',
      icon: <UsergroupAddOutlined />,
      label: <Link to="/admin/managerRole">Quản lý quyền hạn</Link>,
    });
  }

  // Quản lý vai trò (ROLES)
  if (hasPermissionForModules('ROLES')) {
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
          onClick={() => {
            dispatch(logoutUser());
            message.success('Đăng xuất thành công');
            navigate('/login');
          }}
        >
          Đăng xuất
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', position: 'relative' }}>
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
            height: 32,
            margin: 16,
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#1890ff',
          }}
        >
          <BugOutlined /> {!collapsed && 'Hệ Thống Quản Trị'}
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
            {location.pathname === '/' ? (
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1890ff',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    animation: 'marquee 12s linear infinite',
                  }}
                >
                  🚀 Chào mừng bạn đến với trang quản trị – Quản lý dữ liệu dễ dàng 🚀
                </div>
                <style>
                  {`
                    @keyframes marquee {
                      0% { transform: translateX(100%); }
                      100% { transform: translateX(-100%); }
                    }

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
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminSidebar;

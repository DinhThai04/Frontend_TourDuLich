import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Avatar, Button, Divider, Drawer, Dropdown, message } from 'antd';
import { DownOutlined, MenuOutlined, ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import brand from '@/assets/branding/sgu-tour-header.svg';
import Container from '@/components/Share/Container';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { ADMIN_ACCESS, hasPermission, TOUR_GUIDE_ACCESS } from '@/config/access';
import { customerRoute } from '@/layouts/customerRoutes';

export default function Navbar({ allowLeave = () => true }: { allowLeave?: () => boolean }) {
  const location = useLocation();
  const route = customerRoute(location.pathname);
  const checkout = route.checkoutStep !== null;
  const support = location.pathname === '/about' || location.pathname === '/policies';
  const [compact, setCompact] = useState(() => window.scrollY > 16);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 16);
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    if (!allowLeave()) return;
    setDrawerOpen(false);
    const result = await dispatch(logoutUser());
    if (logoutUser.rejected.match(result)) {
      message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
    } else {
      message.success('Đăng xuất thành công');
    }
  };

  const supportItems = [
    { key: 'faq', label: <Link to="/policies#faq">Câu hỏi thường gặp</Link> },
    { key: 'policies', label: <Link to="/policies">Chính sách đặt tour</Link> },
    { key: 'contact', label: <Link to="/about#lien-he">Liên hệ</Link> },
  ];

  const isTourGuide = hasPermission(user, TOUR_GUIDE_ACCESS) && !hasPermission(user, ADMIN_ACCESS);
  const userItems = [
    { key: 'profile', label: <Link to="/profile">Hồ sơ</Link> },
    { key: 'bookings', label: <Link to="/profile#don-dat-tour">Đơn đặt chỗ</Link> },
    { key: 'support', label: <Link to="/profile#yeu-cau-ho-tro">Yêu cầu hỗ trợ</Link> },
    ...(isTourGuide ? [{ key: 'assigned-departures', label: <Link to="/van-hanh-chuyen">Chuyến được phân công</Link> }] : []),
    ...(hasPermission(user, ADMIN_ACCESS) ? [{ key: 'admin', label: <Link to="/admin">Trang quản trị</Link> }] : []),
    { type: 'divider' as const },
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  const params = new URLSearchParams(location.search);
  const selectedTour = params.get('tourId');
  const backToTour = selectedTour && /^\d+$/.test(selectedTour) ? `/tours/detail/${selectedTour}` : '/tours';
  const returnUrl = encodeURIComponent(location.pathname + location.search);

  return (
    <div className={`customer-navbar ${compact ? 'is-compact' : ''} ${checkout ? 'customer-navbar--checkout' : ''}`}>
      <Container className="customer-nav-inner">
        <Link to="/" aria-label="Trang chủ SGU Tour" className="customer-brand">
          <img src={brand} alt="SGU Tour" />
        </Link>

        {checkout ? (
          <ol className="customer-header-steps" aria-label="Các bước đặt tour">
            {['Hành khách', 'Thanh toán', 'Kết quả'].map((label, index) => (
              <li
                key={label}
                aria-current={index === route.checkoutStep ? 'step' : undefined}
                className={index <= route.checkoutStep! ? 'is-current' : ''}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        ) : route.paymentResult ? (
          <span className="customer-payment-label">Kết quả thanh toán</span>
        ) : (
          <nav className="customer-primary-nav" aria-label="Điều hướng chính">
            <NavLink to="/" end>Trang chủ</NavLink>
            <NavLink to="/tours">Tour du lịch</NavLink>
            <Dropdown trigger={['hover', 'click']} mouseEnterDelay={0.1} mouseLeaveDelay={0.2} menu={{ items: supportItems }}>
              <button
                type="button"
                className={`customer-support ${support ? 'is-active' : ''}`}
                aria-label="Mở menu hỗ trợ"
              >
                Hỗ trợ <DownOutlined />
              </button>
            </Dropdown>
          </nav>
        )}

        <div className="customer-nav-actions">
          {checkout && (
            <Link to={backToTour} className="customer-back-tour">
              <ArrowLeftOutlined /> Quay lại tour
            </Link>
          )}

          {user?.username ? (
            <Dropdown menu={{ items: userItems }} placement="bottomRight" trigger={['click']}>
              <button type="button" className="customer-account" aria-label="Mở menu tài khoản">
                <Avatar
                  size={36}
                  src={user.avatar || undefined}
                  style={{
                    backgroundColor: '#E6F4F1',
                    color: '#134E48',
                    border: '1.5px solid #1F7A6E',
                    fontWeight: 700,
                  }}
                >
                  {(user.username || 'U').trim().charAt(0).toUpperCase()}
                </Avatar>
              </button>
            </Dropdown>
          ) : (
            <div className="customer-auth-buttons">
              <Link className="customer-login-outline" to={`/login?return=${returnUrl}`}>
                Đăng nhập
              </Link>
              <Link className="customer-register-primary" to="/register">
                Đăng ký
              </Link>
            </div>
          )}

          {!checkout && !route.paymentResult && (
            <Button
              className="customer-mobile-menu"
              icon={<MenuOutlined />}
              aria-label="Mở menu điều hướng"
              onClick={() => setDrawerOpen(true)}
            />
          )}
        </div>
      </Container>

      <Drawer
        title={<span className="text-[#134E48] font-bold text-base">SGU Tour</span>}
        placement="right"
        width={300}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closeIcon={<CloseOutlined />}
      >
        <nav className="flex flex-col gap-1" aria-label="Điều hướng di động">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-[15px] font-medium no-underline ${isActive ? 'bg-[#E6F4F1] text-[#134E48]' : 'text-[#1F2937]'}`
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/tours"
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-[15px] font-medium no-underline ${isActive ? 'bg-[#E6F4F1] text-[#134E48]' : 'text-[#1F2937]'}`
            }
          >
            Tour du lịch
          </NavLink>
          <Divider className="!my-2" />
          <p className="px-3 mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Hỗ trợ</p>
          <Link to="/policies#faq" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
            Câu hỏi thường gặp
          </Link>
          <Link to="/policies" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
            Chính sách đặt tour
          </Link>
          <Link to="/about#lien-he" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
            Liên hệ
          </Link>
          <Divider className="!my-2" />
          {user?.username ? (
            <>
              <p className="px-3 mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Tài khoản</p>
              <Link to="/profile" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
                Hồ sơ
              </Link>
              <Link to="/profile#don-dat-tour" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
                Đơn đặt chỗ
              </Link>
              <Link to="/profile#yeu-cau-ho-tro" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
                Yêu cầu hỗ trợ
              </Link>
              {isTourGuide && (
                <Link to="/van-hanh-chuyen" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
                  Chuyến được phân công
                </Link>
              )}
              {hasPermission(user, ADMIN_ACCESS) && (
                <Link to="/admin" className="px-3 py-2 rounded-lg text-[15px] text-[#1F2937] no-underline hover:bg-[#F8FAFA]">
                  Trang quản trị
                </Link>
              )}
              <Button danger block className="mt-3" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2.5 mt-2">
              <Link to={`/login?return=${returnUrl}`} className="customer-login-outline w-full text-center">
                Đăng nhập
              </Link>
              <Link to="/register" className="customer-register-primary w-full text-center">
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </Drawer>
    </div>
  );
}

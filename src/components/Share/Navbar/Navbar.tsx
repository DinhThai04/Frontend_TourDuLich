import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Avatar, Button, Dropdown, message } from 'antd';
import { DownOutlined, MenuOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import brand from '@/assets/branding/sgu-tour-header.svg';
import Container from '@/components/Share/Container';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import fallback from '@/assets/branding/sgu-tour-icon.svg';
import { ADMIN_ACCESS, hasPermission } from '@/config/access';
import { customerRoute } from '@/layouts/customerRoutes';

export default function Navbar({ allowLeave = () => true }: { allowLeave?: () => boolean }) {
  const location = useLocation();
  const route = customerRoute(location.pathname);
  const checkout = route.checkoutStep !== null;
  const support = location.pathname === '/about' || location.pathname === '/policies';
  const [compact, setCompact] = useState(() => window.scrollY > 32);
  useEffect(() => {
    const update = () => setCompact(window.scrollY > 32);
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const supportItems = [
    { key: 'policies', label: <Link to="/policies" aria-current={location.pathname === '/policies' ? 'page' : undefined}>Chính sách & câu hỏi thường gặp</Link> },
    { key: 'about', label: <Link to="/about" aria-current={location.pathname === '/about' ? 'page' : undefined}>Về SGU Tour</Link> },
  ];
  const userItems = [
    { key: 'profile', label: <Link to="/profile">Tài khoản</Link> },
    { key: 'bookings', label: <Link to="/profile#don-dat-tour">Đơn đặt tour</Link> },
    ...(hasPermission(user, ADMIN_ACCESS) ? [{ key: 'admin', label: <Link to="/admin">Trang quản trị</Link> }] : []),
    { key: 'logout', label: 'Đăng xuất', onClick: async () => {
      if (!allowLeave()) return;
      const result = await dispatch(logoutUser());
      if (logoutUser.rejected.match(result)) message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
      else message.success('Đăng xuất thành công');
    } },
  ];
  const params = new URLSearchParams(location.search);
  const selectedTour = params.get('tourId');
  const backToTour = selectedTour && /^\d+$/.test(selectedTour) ? `/tours/detail/${selectedTour}` : '/tours';
  return <div className={`customer-navbar ${compact ? 'is-compact' : ''} ${checkout ? 'customer-navbar--checkout' : ''}`}>
    <Container className="customer-nav-inner">
      <Link to="/" aria-label="Trang chủ SGU Tour" className="customer-brand"><img src={brand} alt="SGU Tour" /></Link>
      {checkout ? <ol className="customer-header-steps" aria-label="Các bước đặt tour">{['Hành khách', 'Thanh toán', 'Kết quả'].map((label, index) => <li key={label} aria-current={index === route.checkoutStep ? 'step' : undefined} className={index <= route.checkoutStep! ? 'is-current' : ''}><span>{index + 1}</span>{label}</li>)}</ol> : route.paymentResult ? <span className="customer-payment-label">Kết quả thanh toán</span> : <nav className="customer-primary-nav" aria-label="Điều hướng chính">
        <NavLink to="/" end>Trang chủ</NavLink><NavLink to="/tours">Tour du lịch</NavLink>
        <Dropdown trigger={['hover', 'click']} mouseEnterDelay={0.1} mouseLeaveDelay={0.2} menu={{ items: supportItems }}><button type="button" className={`customer-support ${support ? 'is-active' : ''}`} aria-label="Mở menu hỗ trợ">Hỗ trợ <DownOutlined /></button></Dropdown>
      </nav>}
      <div className="customer-nav-actions">
        {!checkout && !route.paymentResult && <Dropdown trigger={['click']} menu={{ items: [{ key: 'home', label: <Link to="/">Trang chủ</Link> },{ key: 'tours', label: <Link to="/tours">Tour du lịch</Link> },...supportItems] }}><Button className="customer-mobile-menu" icon={<MenuOutlined />} aria-label="Mở điều hướng">Menu</Button></Dropdown>}
        {checkout && <Link to={backToTour} className="customer-back-tour"><ArrowLeftOutlined /> Quay lại tour</Link>}
        {user?.username ? <Dropdown menu={{ items: userItems }} placement="bottomRight" trigger={['click']}><button type="button" className="customer-account" aria-label="Mở menu tài khoản"><Avatar size={36} src={user.avatar || fallback} /></button></Dropdown> : <Link className="customer-login" to={`/login?return=${encodeURIComponent(location.pathname + location.search)}`}>Đăng nhập</Link>}
      </div>
    </Container>
  </div>;
}

import Container from './Container';
import brand from '@/assets/branding/sgu-tour.svg';
import { Link } from 'react-router-dom';
export const Footer = () => <footer className="journey-footer"><Container><div className="journey-footer-grid">
  <div><Link to="/" aria-label="Trang chủ SGU Tour"><img src={brand} alt="SGU Tour" width={200} height={76} loading="lazy" /></Link><p>Khám phá các hành trình du lịch Việt Nam.<br />Tìm tour, chọn lịch và theo dõi đặt chỗ trong cùng một nơi.</p></div>
  <nav aria-label="Liên kết cuối trang"><h3>Khám phá</h3><Link to="/tours">Danh sách tour</Link><Link to="/#diem-den-noi-bat">Điểm đến nổi bật</Link><Link to="/about">Về SGU Tour</Link></nav>
  <nav aria-label="Thông tin đặt tour"><h3>Trước khi khởi hành</h3><Link to="/policies">Chính sách và câu hỏi thường gặp</Link><Link to="/profile">Tài khoản và lịch sử đặt tour</Link><p>Hạn giữ chỗ và số tiền thanh toán được hiển thị theo từng booking.</p></nav>
</div><div className="journey-footer-bottom"><span>SGU Tour · Đồ án môn J2EE</span><span>Môi trường học tập và trình diễn</span></div></Container></footer>;

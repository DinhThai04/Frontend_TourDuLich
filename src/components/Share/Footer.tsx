import Container from './Container';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import brandIcon from '@/assets/branding/sgu-tour-icon.svg';

export const Footer = () => (
  <footer className="bg-[#134E48] text-[#E5E7EB] pt-14 pb-[88px]">
    <Container>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1.15fr_1fr] gap-10 lg:gap-12">
        {/* Col 1: Brand icon + white wordmark + description + contact */}
        <div>
          <Link
            to="/"
            aria-label="Trang chủ SGU Tour"
            className="inline-flex items-center gap-3 text-white no-underline hover:opacity-95 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-lg"
          >
            <img src={brandIcon} alt="" width={40} height={40} className="w-10 h-10 rounded-xl shrink-0" />
            <span className="text-[22px] font-bold tracking-[-0.02em] text-white">SGU Tour</span>
          </Link>
          <p className="mt-4 mb-5 text-[14px] leading-[1.7] text-[#D1D5DB] max-w-[320px]">
            Khám phá các hành trình du lịch Việt Nam. Tìm tour, chọn lịch khởi hành và theo dõi đơn đặt chỗ trong cùng một nơi.
          </p>
          <ul className="list-none m-0 p-0 space-y-2.5 text-[14px] text-[#D1D5DB]">
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-[#A7D7CF]" aria-hidden="true" />
              <a href="tel:19001234" className="text-[#D1D5DB] no-underline hover:text-white hover:underline">
                1900 1234 (08:00 – 21:00)
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-[#A7D7CF]" aria-hidden="true" />
              <a href="mailto:hotro@sgutour.vn" className="text-[#D1D5DB] no-underline hover:text-white hover:underline">
                hotro@sgutour.vn
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="shrink-0 mt-0.5 text-[#A7D7CF]" aria-hidden="true" />
              <span>273 An Dương Vương, Quận 5, TP. Hồ Chí Minh</span>
            </li>
          </ul>
        </div>

        {/* Col 2: Khám phá */}
        <nav aria-label="Khám phá SGU Tour">
          <h3 className="m-0 mb-4 text-[15px] font-semibold text-white tracking-[0.01em]">Khám phá</h3>
          <ul className="list-none m-0 p-0 space-y-3 text-[14px]">
            <li>
              <Link to="/tours" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Danh sách tour
              </Link>
            </li>
            <li>
              <Link to="/#diem-den-noi-bat" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Điểm đến nổi bật
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Về SGU Tour
              </Link>
            </li>
          </ul>
        </nav>

        {/* Col 3: Hỗ trợ */}
        <nav aria-label="Hỗ trợ khách hàng">
          <h3 className="m-0 mb-4 text-[15px] font-semibold text-white tracking-[0.01em]">Hỗ trợ</h3>
          <ul className="list-none m-0 p-0 space-y-3 text-[14px]">
            <li>
              <Link to="/policies" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Chính sách và câu hỏi thường gặp
              </Link>
            </li>
            <li>
              <Link to="/#diem-noi-bat" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Hướng dẫn đặt tour
              </Link>
            </li>
            <li>
              <Link to="/profile#don-dat-tour" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Tài khoản và lịch sử đặt tour
              </Link>
            </li>
            <li>
              <Link to="/about#lien-he" className="text-[#D1D5DB] no-underline hover:text-white hover:underline transition-colors">
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        {/* Col 4: Kết nối */}
        <div>
          <h3 className="m-0 mb-4 text-[15px] font-semibold text-white tracking-[0.01em]">Kết nối</h3>
          <p className="m-0 mb-4 text-[14px] leading-[1.6] text-[#D1D5DB]">
            Theo dõi lịch khởi hành mới và ưu đãi theo mùa từ SGU Tour.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook SGU Tour"
              className="w-10 h-10 rounded-full border border-white/25 bg-white/10 text-white flex items-center justify-center no-underline hover:bg-white hover:text-[#134E48] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.6V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H7.7v3h2.6v8h3.2z" />
              </svg>
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              aria-label="Zalo SGU Tour"
              className="w-10 h-10 rounded-full border border-white/25 bg-white/10 text-white text-[12px] font-bold flex items-center justify-center no-underline hover:bg-white hover:text-[#134E48] transition-colors"
            >
              Zalo
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube SGU Tour"
              className="w-10 h-10 rounded-full border border-white/25 bg-white/10 text-white flex items-center justify-center no-underline hover:bg-white hover:text-[#134E48] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C2 9 2 12 2 12s0 3 .4 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
              </svg>
            </a>
          </div>
          <a href="mailto:hotro@sgutour.vn" className="text-[14px] text-[#D1D5DB] no-underline hover:text-white hover:underline">
            hotro@sgutour.vn
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px] text-[#D1D5DB]">
        <span>© 2026 SGU Tour · Đồ án môn J2EE</span>
        <div className="flex items-center gap-3">
          <Link to="/terms" className="text-[#D1D5DB] no-underline hover:text-white hover:underline">
            Điều khoản
          </Link>
          <span aria-hidden="true" className="text-white/40">·</span>
          <Link to="/privacy" className="text-[#D1D5DB] no-underline hover:text-white hover:underline">
            Bảo mật
          </Link>
        </div>
      </div>
    </Container>
  </footer>
);

import { Link } from 'react-router-dom';
import './about.css';

const values = [
  { title: 'Xem rõ hành trình', text: 'Đọc lịch trình theo ngày, điểm đi và điểm đến trước khi lựa chọn tour.' },
  { title: 'Chọn lịch khởi hành', text: 'Xem ngày đi, giá theo nhóm tuổi và số chỗ của chuyến đang quan tâm.' },
  { title: 'Theo dõi đặt chỗ', text: 'Quản lý booking, hạn thanh toán và kết quả giao dịch trong tài khoản.' },
];

export default function AboutPage() {
  return (
    <main className="sgu-about">
      <nav aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span> / Về chúng tôi</span>
      </nav>
      <header className="sgu-about-heading">
        <span className="sgu-about-eyebrow">SGU TOUR · DU LỊCH VIỆT NAM</span>
        <h1>Về SGU Tour</h1>
        <p>
          SGU Tour là website tìm và đặt tour du lịch Việt Nam, được xây dựng trong đồ án môn J2EE.
          Bạn có thể xem hành trình, chọn ngày khởi hành và theo dõi đặt chỗ trực tuyến.
        </p>
      </header>
      <section aria-labelledby="about-mission">
        <h2 id="about-mission">Từ lựa chọn đến khởi hành</h2>
        <p>
          Giúp mỗi chuyến đi trở nên dễ lên kế hoạch và dễ dàng thực hiện: từ việc chọn điểm đến,
          xem ngày khởi hành, khai báo hành khách đến kiểm tra thời hạn giữ chỗ và kết quả thanh toán.
        </p>
      </section>
      <section aria-labelledby="about-values">
        <h2 id="about-values">Điều bạn có thể mong đợi</h2>
        <ul className="sgu-about-values">
          {values.map((value) => (
            <li key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="about-contact">
        <h2 id="about-contact">Thông tin trước khi đặt tour</h2>
        <p>Xem điều kiện giữ chỗ và thanh toán trong chính sách của hệ thống. Bạn có thể tra cứu booking trong tài khoản của mình.</p>
        <p>
          Bạn muốn xem trước khi đặt? Hãy xem <Link to="/tours">danh sách tour</Link> hoặc đọc{' '}
          <Link to="/policies">chính sách &amp; câu hỏi thường gặp</Link>.
        </p>
      </section>
    </main>
  );
}

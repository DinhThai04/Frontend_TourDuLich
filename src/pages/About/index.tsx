import { Link } from 'react-router-dom';
import './about.css';

const values = [
  {
    title: 'Hành trình được tuyển chọn',
    text: 'Mỗi tour đều được kiểm tra lịch trình, phương tiện và điểm đến trước khi mở bán, để bạn yên tâm tận hưởng chuyến đi.',
  },
  {
    title: 'Giá minh bạch',
    text: 'Giá niêm yết hiển thị rõ theo từng ngày khởi hành, không phụ phí ẩn. Bạn luôn biết mình thanh toán cho điều gì.',
  },
  {
    title: 'Đồng hành trước và sau chuyến đi',
    text: 'Đội ngũ hỗ trợ trao đổi qua hotline và email trong suốt quá trình đặt chỗ, thanh toán và chuẩn bị khởi hành.',
  },
];

export default function AboutPage() {
  return (
    <main className="sgu-about">
      <nav aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span> / Về chúng tôi</span>
      </nav>
      <header className="sgu-about-heading">
        <span className="sgu-about-eyebrow">SGU TOUR · ĐỒNG HÀNH CÙNG BẠN</span>
        <h1>Về SGU Tour</h1>
        <p>
          SGU Tour kết nối du khách với những hành trình trong nước và quốc tế được tổ chức
          trọn gói: lịch trình rõ ràng, phương tiện phù hợp và đội ngũ hỗ trợ tận tâm.
        </p>
      </header>
      <section aria-labelledby="about-mission">
        <h2 id="about-mission">Sứ mệnh của chúng tôi</h2>
        <p>
          Giúp mỗi chuyến đi trở nên dễ lên kế hoạch và dễ dàng thực hiện: từ việc chọn điểm đến,
          xem ngày khởi hành, đặt chỗ trực tuyến đến thanh toán an toàn và nhận hỗ trợ khi cần.
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
        <h2 id="about-contact">Liên hệ</h2>
        <p>
          123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh · Hotline{' '}
          <a href="tel:+84123456789">+84 123 456 789</a> · Email{' '}
          <a href="mailto:danhcong6205@gmail.com">danhcong6205@gmail.com</a>
        </p>
        <p>
          Bạn muốn xem trước khi đặt? Hãy xem <Link to="/tours">danh sách tour</Link> hoặc đọc{' '}
          <Link to="/policies">chính sách &amp; câu hỏi thường gặp</Link>.
        </p>
      </section>
    </main>
  );
}

import Container from '@/components/Share/Container';
import { Link } from 'react-router-dom';

export default function LegalPage({ mode }: { mode: 'terms' | 'privacy' }) {
  const isTerms = mode === 'terms';
  return (
    <div className="bg-[#F8FAFA] py-12 md:py-16">
      <Container>
        <div className="max-w-[820px] mx-auto bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-10">
          <nav aria-label="Đường dẫn" className="text-[13px] text-[#6B7280] mb-4 flex items-center gap-2">
            <Link to="/" className="text-[#1F7A6E] no-underline hover:underline">Trang chủ</Link>
            <span aria-hidden="true">›</span>
            <span>{isTerms ? 'Điều khoản sử dụng' : 'Chính sách bảo mật'}</span>
          </nav>
          <h1 className="text-[28px] md:text-[32px] font-bold text-[#134E48] m-0 mb-3">
            {isTerms ? 'Điều khoản sử dụng dịch vụ' : 'Chính sách bảo mật thông tin'}
          </h1>
          <p className="text-[14px] text-[#6B7280] mb-8">
            Cập nhật lần cuối: 2026 · Áp dụng cho hệ thống đặt tour SGU Tour.
          </p>

          {isTerms ? (
            <div className="space-y-6 text-[15px] leading-[1.75] text-[#1F2937]">
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">1. Đặt chỗ và giữ chỗ</h2>
                <p className="m-0">
                  Hạn giữ chỗ và số tiền thanh toán được hiển thị rõ ràng theo từng booking tại bước xác nhận và trong mục Đơn đặt chỗ của tài khoản. Đơn chưa thanh toán sẽ tự động hết hạn khi quá thời gian giữ chỗ.
                </p>
              </section>
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">2. Thanh toán và hóa đơn</h2>
                <p className="m-0">
                  Khách hàng thanh toán trực tuyến qua các cổng thanh toán được hỗ trợ (VNPay). Sau khi giao dịch thành công, vé điện tử và hóa đơn sẽ được cập nhật trực tiếp trong tài khoản.
                </p>
              </section>
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">3. Dời lịch và hủy tour</h2>
                <p className="m-0">
                  Với các đơn đã thanh toán và chưa khởi hành, khách hàng có thể gửi yêu cầu dời lịch hoặc hỗ trợ thay đổi hành khách tại mục Yêu cầu hỗ trợ trong trang Tài khoản. Chi tiết mức hoàn hủy vui lòng xem tại{' '}
                  <Link to="/policies" className="text-[#1F7A6E] underline">Chính sách đặt tour</Link>.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-6 text-[15px] leading-[1.75] text-[#1F2937]">
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">1. Thông tin thu thập</h2>
                <p className="m-0">
                  SGU Tour chỉ thu thập các thông tin cần thiết để quản lý tài khoản và tổ chức chuyến đi gồm: họ tên, email, số điện thoại, địa chỉ và danh sách hành khách tham gia tour.
                </p>
              </section>
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">2. Mục đích sử dụng</h2>
                <p className="m-0">
                  Thông tin của bạn được dùng để xác nhận đặt chỗ, xuất hóa đơn, gửi thông báo lịch khởi hành và hỗ trợ xử lý các yêu cầu thay đổi chuyến đi.
                </p>
              </section>
              <section>
                <h2 className="text-[18px] font-semibold text-[#134E48] mb-2">3. Bảo vệ dữ liệu</h2>
                <p className="m-0">
                  Phiên đăng nhập và giao dịch thanh toán được bảo vệ bằng mã hóa chuẩn. Bạn có thể xem hoặc cập nhật thông tin cá nhân bất cứ lúc nào tại trang{' '}
                  <Link to="/profile" className="text-[#1F7A6E] underline">Hồ sơ tài khoản</Link>.
                </p>
              </section>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

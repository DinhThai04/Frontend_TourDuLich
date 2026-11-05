import { errorMessage } from '@/utils/errors';
import { formatDatetime } from '@/utils';
import { Row, Col, Card, Spin, Alert, message, Button } from 'antd';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';

import InvoiceForm from '@/components/Invoice/InvoiceForm';
import bookingServices from '@/services/bookingServices';
import { getTourDepartureById } from '@/services/tourServices';
import { sessionService } from '@/services/sessionServices';
import paymentServices from '@/services/paymentServices';
import type { BookingResponse, CustomerResponse } from '@/types/Booking';
import type { PaymentQuote } from '@/types/Invoice';
import type { ITourDeparture } from '@/types/Tour';

/** Only redirect to a trusted VNPay host, never to an arbitrary server-provided URL. */
const VNPAY_HOSTS = new Set(
  (import.meta.env.VITE_VNPAY_ALLOWED_HOSTS ?? 'sandbox.vnpayment.vn,pay.vnpayment.vn')
    .split(',')
    .map((host: string) => host.trim().toLowerCase())
    .filter(Boolean)
);
const isSafeVnPayUrl = (url: unknown): url is string => {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && VNPAY_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

export default function InvoiceLayout() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The route keeps this component mounted, so a slow response for the previous booking
  // must never overwrite the booking currently in the address bar.
  const requestSeq = useRef(0);

  const [currentUser, setCurrentUser] = useState<ReturnType<typeof sessionService.getUser>>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse>();
  const [tourDepartureResult, setTourDepartureResult] = useState<ITourDeparture>();
  const [customerResult, setCustomerResult] = useState<CustomerResponse[]>([]);
  const [quote, setQuote] = useState<PaymentQuote>();

  /** ---------------------------------------------------------
   * 🔹 Load toàn bộ dữ liệu: Booking, Customer, TourDeparture
   ----------------------------------------------------------*/
  const loadData = useCallback(async (bookingId: number) => {
    const run = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const user = sessionService.getUser();
      if (!user) {
        throw new Error('Không thể xác định người dùng (session error).');
      } else {
        const bookingRes = await bookingServices.getById(bookingId);
        if (bookingRes.code !== 1000 || !bookingRes.result) {
          throw new Error('Không tải được thông tin đặt tour.');
        }
        const booking = bookingRes.result as BookingResponse;
        if (['UNCONFIRMED', 'CANCELLED', 'EXPIRED'].includes(booking.status ?? '')) throw new Error('Booking đã hủy hoặc hết hạn. Vui lòng đặt lại nếu chuyến đi còn chỗ.');
        if (booking.reservationStatus === 'PAID') throw new Error('Booking này đã thanh toán. Bạn có thể xem hóa đơn trong lịch sử đặt tour.');
        if (!booking.reservationStatus) throw new Error('Booking cũ chưa có giữ chỗ thanh toán trực tuyến. Vui lòng liên hệ SGU Tour để được hỗ trợ.');

        // Each dependency reports its own failure so one broken API does not hide the real cause.
        const [customerRes, tourRes, quoteRes] = await Promise.allSettled([
          bookingServices.getListOfCustomersByBookingId(bookingId),
          getTourDepartureById(Number(booking.tourDepartureId)),
          paymentServices.quote(bookingId),
        ]);

        if (customerRes.status === 'rejected' || customerRes.value.code !== 1000) {
          throw new Error('Không tải được danh sách hành khách của booking.');
        }
        if (tourRes.status === 'rejected' || tourRes.value.code !== 1000 || !tourRes.value.result) {
          throw new Error('Không tải được thông tin chuyến đi.');
        }
        if (quoteRes.status === 'rejected' || quoteRes.value.code !== 1000 || !quoteRes.value.result) {
          throw new Error('Không tải được giá thanh toán của booking.');
        }

        const tourDeparture = tourRes.value.result;
        if (['SUSPENDED', 'CANCELLED'].includes(tourDeparture.operationalStatus || '')) {
          throw new Error('Chuyến cũ đang dừng do sự cố. Vui lòng vào Hồ sơ → Lịch sử đặt chỗ → Dời lịch để phản hồi; không thanh toán theo lịch cũ.');
        }

        if (run !== requestSeq.current) return;
        setCurrentUser(user);
        setBookingResult(booking);
        setCustomerResult(customerRes.value.result ?? []);
        setTourDepartureResult(tourDeparture);
        setQuote(quoteRes.value.result);
      }
    } catch (err: unknown) {
      if (run !== requestSeq.current) return;
      setError(errorMessage(err));
      message.error(errorMessage(err));
    } finally {
      if (run === requestSeq.current) setLoading(false);
    }
  }, []);

  /** Call loadData khi id thay đổi */
  useEffect(() => {
    if (id) {
      loadData(Number(id));
    }
  }, [id, loadData]);

  /** ---------------------------------------------------------
   * 🔹 Tạo phiên thanh toán VNPay cho booking đang giữ chỗ
   ----------------------------------------------------------*/
  const handleCreatePayment = async (totalAmount: number) => {
    try {
      if (!bookingResult || !tourDepartureResult || !customerResult.length) {
        throw new Error('Thiếu booking, hành khách hoặc bảng giá.');
      }
      if (id && Number(bookingResult.id) !== Number(id)) {
        throw new Error('Dữ liệu booking chưa khớp với hóa đơn đang mở. Vui lòng tải lại trang.');
      }
      if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) {
        throw new Error('Số tiền thanh toán không hợp lệ.');
      }
      const url = await paymentServices.create({ bookingId: Number(bookingResult.id), expectedAmount: String(totalAmount) });
      if (!isSafeVnPayUrl(url)) {
        throw new Error('URL thanh toán VNPay không hợp lệ.');
      }
      // Booking and amount are persisted by the backend; no invoice_temp dependency.
      window.location.assign(url);
    } catch (err: unknown) {
      const text = errorMessage(err, 'Không thể tạo thanh toán.');
      message.error(text);
    }
  };

  /** ---------------------------------------------------------
   * Render
   ----------------------------------------------------------*/
  return (
    <div style={{ padding: '24px 10rem', background: '#fff', minHeight: '100vh' }}>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            {loading && <Spin />}
            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                action={id ? (
                  <Button size="small" onClick={() => void loadData(Number(id))}>Thử lại</Button>
                ) : undefined}
              />
            )}

            {!loading && !error && bookingResult && (
              <Alert type="info" showIcon style={{ marginBottom: 16 }}
                message={bookingResult.paymentRequiredNow ? 'Cần thanh toán ngay để hoàn tất đặt tour' : 'Booking đang chờ thanh toán'}
                description={bookingResult.paymentDeadline ? `Chỗ được giữ đến ${formatDatetime(bookingResult.paymentDeadline)}. Nếu chưa thanh toán khi hết hạn, booking sẽ tự hủy.` : 'Vui lòng kiểm tra thông tin và tiếp tục thanh toán.'} />
            )}
            {!loading && !error && bookingResult && (
              <InvoiceForm
                account={{
                  fullName: currentUser?.username || 'Khách hàng',
                  email: currentUser?.email || '',
                  phone: currentUser?.phone || '',
                }}
                customers={customerResult}
                tourDeparture={tourDepartureResult}
                quote={quote}
                onCreate={handleCreatePayment}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

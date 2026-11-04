import { useEffect, useState } from 'react';
import { Spin, Card, Result, Button, Descriptions } from 'antd';
import axios from 'axios';
import paymentServices from '@/services/paymentServices';
import { formatCurrencyVND } from '@/utils';

type PaymentResult = {
  status: string; responseCode: string; transactionStatus: string;
  orderId: string; amount: string; transactionNo?: string; bankCode?: string;
};

/** Stop verifying after this long so the page never spins forever. */
const VERIFY_TIMEOUT_MS = 25000;
/** Re-query transient network failures within the timeout window. */
const RETRY_INTERVAL_MS = 3000;

export default function VnPayCallback() {
  return <BookingVnPayCallback />;
}
function BookingVnPayCallback() {
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');
  const [refunded, setRefunded] = useState(false);
  // Only transient failures can change on another poll; a settled failure already expired the booking.
  const [retryable, setRetryable] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setPayment(null);
    setError('');
    setRefunded(false);
    setRetryable(true);
    setLoading(true);
    setAttempt((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const deadline = Date.now() + VERIFY_TIMEOUT_MS;

    function stopTimers() {
      if (retryTimer) clearTimeout(retryTimer);
      clearTimeout(deadlineTimer);
    }
    function finish(apply: () => void) {
      if (!active) return;
      stopTimers();
      apply();
      setLoading(false);
    }
    // Hard cap: abort a hung request and show a retryable error state.
    const deadlineTimer = setTimeout(() => {
      if (!active) return;
      controller.abort();
      finish(() => setError('Hết thời gian xác thực giao dịch. Vui lòng kiểm tra lịch sử đặt tour hoặc bấm Thử lại.'));
    }, VERIFY_TIMEOUT_MS);

    const verify = async () => {
      try {
        const res = await paymentServices.get(
          `/payment/vnpay/bookings/return${window.location.search}`,
          { signal: controller.signal },
        );
        const result = res.result as PaymentResult;
        if (result?.status === 'refunded') {
          finish(() => {
            setRefunded(true);
            setRetryable(false);
            setError('Giao dịch này đã được ghi nhận hoàn tiền sau đối soát. Vui lòng xem lịch sử hoặc liên hệ hỗ trợ nếu cần kiểm tra chứng từ.');
          });
          return;
        }
        if (result?.status === 'reconciliation') {
          finish(() => {
            setRetryable(false);
            setError('Đã nhận kết quả giao dịch nhưng booking cần đối soát (có thể đã hết hạn hoặc thay đổi). Nếu ngân hàng đã trừ tiền, vui lòng liên hệ hỗ trợ và không thanh toán lại.');
          });
          return;
        }
        // The provider signalled an ambiguous result: the backend keeps the seats and waits
        // for a retried IPN or reconciliation, so this is not a released booking.
        if (result?.status === 'pending') {
          finish(() => {
            setRetryable(false);
            setError('Giao dịch đã được ghi nhận nhưng chưa có kết quả cuối cùng. Vui lòng không thanh toán lại và kiểm tra Lịch sử đặt tour sau ít phút.');
          });
          return;
        }
        if (res.code !== 1000 || result?.status !== 'success' ||
            result?.responseCode !== '00' || result?.transactionStatus !== '00') {
          const code = result?.responseCode;
          finish(() => {
            setRetryable(false);
            setError(code && code !== '00'
              ? `Giao dịch không thành công (mã ${code}). Booking đã được giải phóng chỗ; vui lòng đặt lại tour nếu vẫn còn nhu cầu.`
              : 'Giao dịch đã hủy hoặc chưa hoàn tất. Booking đã được giải phóng chỗ; vui lòng đặt lại tour nếu vẫn còn nhu cầu.');
          });
          return;
        }
        finish(() => setPayment(result));
      } catch (err: unknown) {
        if (!active || controller.signal.aborted) return;
        // 4xx means the gateway/payment service has already made up its mind (bad signature,
        // unknown booking): retrying cannot change the outcome, so surface it immediately.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        const transient = status === undefined || status === 408 || status === 429 || status >= 500;
        if (transient && Date.now() < deadline) {
          retryTimer = setTimeout(() => { void verify(); }, RETRY_INTERVAL_MS);
          return;
        }
        const backendMessage = axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : undefined;
        finish(() => {
          if (!transient) setRetryable(false);
          // Never fall through to err.message: "Request failed with status code 502" is a
          // developer string on a page the customer reads right after paying.
          setError(backendMessage || 'Không thể xác minh thanh toán ngay lúc này. Vui lòng kiểm tra Lịch sử đặt tour hoặc bấm Thử lại.');
        });
      }
    };

    void verify();
    return () => {
      active = false;
      controller.abort();
      stopTimers();
    };
  }, [attempt]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><Spin /><p>Đang xác thực giao dịch...</p></div>;
  return <div style={{ padding: '24px' }}>
    <Result status={payment ? 'success' : refunded ? 'info' : 'error'}
      title={payment ? 'Thanh toán thành công!' : refunded ? 'Đã ghi nhận hoàn tiền' : 'Chưa hoàn tất thanh toán'}
      subTitle={payment ? `Mã giao dịch: ${payment.orderId}` : error}
      extra={<>
        {!payment && !refunded && retryable && <Button type="primary" onClick={retry} style={{ marginRight: 8 }}>Thử lại</Button>}
        <Button href="/profile">Lịch sử đặt tour</Button>
      </>} />
    {payment && <Card title="Thông tin giao dịch"><Descriptions bordered column={1}>
      <Descriptions.Item label="Số tiền">{formatCurrencyVND(Number(payment.amount))}</Descriptions.Item>
      <Descriptions.Item label="Mã giao dịch VNPay">{payment.transactionNo}</Descriptions.Item>
      <Descriptions.Item label="Ngân hàng">{payment.bankCode}</Descriptions.Item>
    </Descriptions></Card>}
  </div>;
}

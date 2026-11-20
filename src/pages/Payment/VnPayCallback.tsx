import { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Result, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import JourneySteps from '@/components/Share/JourneySteps';
import paymentServices from '@/services/paymentServices';
import { formatCurrencyVND } from '@/utils';
import { bookingHistoryLink } from '@/utils/booking';

type PaymentResult = {
  status: string;
  bookingId?: number;
  orderId: string;
  amount: string;
  transactionNo?: string;
  bankCode?: string;
};

type Outcome =
  | { kind: 'success'; payment: PaymentResult }
  | { kind: 'pending' | 'reconciliation' | 'refunded' | 'failed' | 'unverified'; payment?: PaymentResult }
  | { kind: 'unavailable'; retryable: boolean };

const VERIFY_TIMEOUT_MS = 25000;
const RETRY_INTERVAL_MS = 3000;

const resultCopy = {
  success: { status: 'success', title: 'Thanh toán thành công', description: 'Bạn có thể xem đơn và hóa đơn trong tài khoản.' },
  pending: { status: 'info', title: 'Đang xác nhận giao dịch', description: 'Hệ thống chưa nhận được kết quả cuối cùng. Nếu ngân hàng đã trừ tiền, vui lòng chờ và không thanh toán lại.' },
  reconciliation: { status: 'warning', title: 'Giao dịch cần đối soát', description: 'Vui lòng mở đơn để theo dõi. Nếu ngân hàng đã trừ tiền, liên hệ SGU Tour và không thanh toán lại.' },
  refunded: { status: 'info', title: 'Đã ghi nhận hoàn tiền', description: 'Bạn có thể xem lại thông tin đơn hoặc liên hệ SGU Tour để kiểm tra chứng từ.' },
  failed: { status: 'error', title: 'Giao dịch không thành công', description: 'Mở đơn để kiểm tra hạn giữ chỗ và các bước tiếp theo. Nếu ngân hàng đã trừ tiền, hãy liên hệ SGU Tour trước khi thanh toán lại.' },
  unverified: { status: 'info', title: 'Chưa xác nhận được giao dịch', description: 'Bạn có thể kiểm tra lại kết quả hoặc mở lịch sử đơn. Nếu ngân hàng đã trừ tiền, vui lòng không thanh toán lại trong lúc chờ xác nhận.' },
  unavailable: { status: 'warning', title: 'Không thể xác minh giao dịch', description: 'Mở lịch sử đặt tour để kiểm tra đơn hoặc liên hệ SGU Tour nếu ngân hàng đã trừ tiền.' },
} as const;

export default function VnPayCallback() {
  const { search } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ request: string; outcome: Outcome }>();
  const request = `${attempt}:${search}`;
  const outcome = state?.request === request ? state.outcome : undefined;

  useEffect(() => {
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    function stop() {
      clearTimeout(deadlineTimer);
      clearTimeout(retryTimer);
      controller.abort();
    }

    function finish(outcome: Outcome) {
      if (controller.signal.aborted) return;
      stop();
      setState({ request, outcome });
    }

    async function verify() {
      try {
        const { code, result } = await paymentServices.get(
          `/payment/vnpay/bookings/return${search}`, { signal: controller.signal },
        );
        const payment = result as PaymentResult | undefined;
        if (code !== 1000 || !payment) {
          finish({ kind: 'unverified' });
          return;
        }
        switch (payment.status) {
          case 'success': finish({ kind: 'success', payment }); break;
          case 'pending': finish({ kind: 'pending', payment }); break;
          case 'reconciliation': finish({ kind: 'reconciliation', payment }); break;
          case 'refunded': finish({ kind: 'refunded', payment }); break;
          case 'failed': finish({ kind: 'failed', payment }); break;
          default: finish({ kind: 'unverified', payment });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === undefined || status === 408 || status === 429 || status >= 500) {
          retryTimer = setTimeout(() => { void verify(); }, RETRY_INTERVAL_MS);
        } else {
          finish({ kind: 'unavailable', retryable: status === 401 });
        }
      }
    }

    const deadlineTimer = setTimeout(() => finish({ kind: 'unverified' }), VERIFY_TIMEOUT_MS);
    void verify();
    return stop;
  }, [request, search]);

  if (!outcome) return <div className="!py-20 text-center" role="status">
    <Spin /><p>Đang xác nhận giao dịch…</p>
  </div>;

  const copy = resultCopy[outcome.kind];
  const payment = 'payment' in outcome ? outcome.payment : undefined;
  const bookingId = payment?.bookingId;
  const showRetry = ['pending', 'unverified'].includes(outcome.kind) ||
    (outcome.kind === 'unavailable' && outcome.retryable);

  return <div className="!p-6">
    <JourneySteps current={2} />
    <Result status={copy.status} title={copy.title}
      subTitle={bookingId ? `Đơn #${bookingId}. ${copy.description}` : copy.description}
      extra={<div className="flex flex-wrap justify-center gap-2">
        {showRetry && <Button type="primary" onClick={() => setAttempt(value => value + 1)}>
          Kiểm tra lại trạng thái
        </Button>}
        <Button type={showRetry ? 'default' : 'primary'} href={bookingHistoryLink(bookingId)}>
          {bookingId ? 'Xem đơn này' : 'Lịch sử đặt tour'}
        </Button>
      </div>} />
    {outcome.kind === 'success' && <Card className="journey-ticket" title="Biên nhận thanh toán">
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Số tiền">{formatCurrencyVND(Number(outcome.payment.amount))}</Descriptions.Item>
        <Descriptions.Item label="Mã giao dịch">{outcome.payment.orderId}</Descriptions.Item>
        <Descriptions.Item label="Mã giao dịch VNPAY">{outcome.payment.transactionNo || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngân hàng">{outcome.payment.bankCode || '—'}</Descriptions.Item>
      </Descriptions>
    </Card>}
  </div>;
}

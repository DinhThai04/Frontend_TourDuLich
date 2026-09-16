import { useEffect, useState, useRef } from 'react';
import { Spin, Card, Result, Button, Descriptions } from 'antd';
import paymentServices from '@/services/paymentServices';
import invoiceServices from '@/services/invoiceServices';

export default function VnPayCallback() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [invoice, setInvoice] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');
  const calledRef = useRef(false);

  /**
   * Xử lý tạo invoice sau khi thanh toán thành công
   */
  const createInvoiceAfterPayment = async () => {
    const temp = sessionStorage.getItem('invoice_temp');
    const data = temp ? JSON.parse(temp) : null;

    if (!data?.invoiceRequest) {
      throw new Error('Không tìm thấy dữ liệu invoice để lưu.');
    }

    const res = await invoiceServices.create(data.invoiceRequest);

    if (res.code === 1000) {
      sessionStorage.removeItem('invoice_temp');
      return true;
    }

    return false;
  };

  /**
   * Gọi API kiểm tra callback thanh toán
   */
  const fetchPaymentStatus = async () => {
    try {
      const queryString = window.location.search;
      const callbackPaymentUrl = `http://localhost:8888/api/v1/payment/vnpay/return${queryString}`;

      const paymentCallbackRes = await paymentServices.get(callbackPaymentUrl);

      if (paymentCallbackRes.code === 1000) {
        setStatus('success');
        setInvoice(paymentCallbackRes.result);

        // Tạo invoice sau khi thanh toán thành công
        const ok = await createInvoiceAfterPayment();
        if (!ok) {
          setError('Thanh toán thành công nhưng tạo hóa đơn thất bại.');
        }
      } else {
        setStatus('fail');
        setError(paymentCallbackRes.result || 'Thanh toán thất bại!');
      }
    } catch (err: any) {
      setStatus('fail');
      setError(err?.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hook chạy 1 lần (kể cả StrictMode)
   */
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    fetchPaymentStatus();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <Spin size="large" />
        <p>Đang xác thực giao dịch...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 10rem' }}>
      {status === 'success' ? (
        <>
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={`Mã giao dịch: ${invoice?.orderId}`}
          />

          {/* FORM THÔNG TIN GIAO DỊCH */}
          <Card title="Thông tin giao dịch">
            <Descriptions column={1} bordered>
              {Object.entries(invoice || {}).map(([key, value]) => (
                <Descriptions.Item label={key} key={key}>
                  {String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button className="home-btn" href="/" key="home">
              Về trang chủ
            </Button>
          </div>
        </>
      ) : (
        <Result
          status="error"
          title="Thanh toán thất bại"
          subTitle={error || 'Giao dịch không hợp lệ'}
          extra={[
            <Button href="/" key="home">
              Về trang chủ
            </Button>,
          ]}
        />
      )}
    </div>
  );
}

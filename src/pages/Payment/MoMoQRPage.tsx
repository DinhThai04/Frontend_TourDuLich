import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Alert, Card } from 'antd';
import MoMoQR from '@/components/Payment/MoMoQR';
import invoiceServices from '@/services/invoiceServices';

export default function MoMoQRPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentQr, setPaymentQr] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await invoiceServices.getById(Number(id));
        const result = (res as any).result || {};
        setPaymentQr(result.paymentQrBase64 || null);
        setPaymentUrl(result.paymentUrl || null);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div style={{ padding: '24px 10rem' }}>
      <Card style={{ textAlign: 'center' }}>
        <MoMoQR paymentQrBase64={paymentQr} paymentUrl={paymentUrl} />
      </Card>
    </div>
  );
}

import { Button, Card, Space, Typography } from 'antd';

const { Text, Title } = Typography;

type Props = {
  paymentQrBase64?: string | null;
  paymentUrl?: string | null;
  onClose?: () => void;
};

export default function MoMoQR({ paymentQrBase64, paymentUrl, onClose }: Props) {
  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      // small feedback could be added
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <Card style={{ textAlign: 'center' }}>
      <Title level={4}>Thanh toán bằng MoMo</Title>
      <Space direction="vertical" size={16} style={{ width: '100%', alignItems: 'center' }}>
        {paymentQrBase64 ? (
          <img
            src={paymentQrBase64}
            alt="MoMo QR"
            style={{ width: 260, height: 260, objectFit: 'contain', borderRadius: 8 }}
          />
        ) : (
          <Text type="secondary">QR không có sẵn. Vui lòng dùng đường dẫn thanh toán.</Text>
        )}

        {paymentUrl && (
          <div style={{ textAlign: 'center' }}>
            <Text copyable>{paymentUrl}</Text>
          </div>
        )}

        <Space>
          {paymentUrl && (
            <Button type="primary" onClick={() => window.open(paymentUrl, '_blank')}>
              Mở liên kết thanh toán
            </Button>
          )}
          {paymentUrl && (
            <Button onClick={() => copyToClipboard(paymentUrl)}>Sao chép liên kết</Button>
          )}
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      </Space>
    </Card>
  );
}

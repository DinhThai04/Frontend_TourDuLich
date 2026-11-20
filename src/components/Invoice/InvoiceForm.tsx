import type { CustomerResponse } from '@/types/Booking';
import type { ColumnsType } from 'antd/es/table';
import {
  Card,
  Grid,
  Typography,
  Table,
  Button,
  Modal,
  Descriptions,
  Divider,
  Alert,
} from 'antd';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND, formatDate, formatDatetime } from '@/utils';
import PriceBreakdown from '@/components/Share/PriceBreakdown';
import { passengerLabel, PARTY_TYPES, tourPriceNote } from '@/utils/booking';
import type { InvoiceFormProps } from '@/types/Invoice';

const { Title } = Typography;

export default function InvoiceForm({
  account,
  customers = [],
  tourDeparture,
  quote,
  paymentDeadline,
  onCreate,
}: InvoiceFormProps) {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [loading, setLoading] = useState(false);
  // Giá do server tính; giao diện chỉ hiển thị để tránh lệch với số tiền thực thu.
  const totalAmount = Number(quote?.amount ?? 0);

  // The confirm dialog is a portal outside this card, so `loading` alone cannot stop a second one.
  const confirmOpen = useRef(false);

  const handleSubmit = async () => {
    if (confirmOpen.current) return;
    if (!customers.length || !quote || totalAmount <= 0) {
      Modal.error({ title: 'Chưa thể thanh toán', content: 'Chưa tải được hành khách hoặc giá thanh toán.' });
      return;
    }
    confirmOpen.current = true;
    Modal.confirm({
      title: 'Xác nhận thanh toán',
      content: (
        <>
          <p>Bạn có chắc chắn muốn thanh toán hóa đơn này?</p>
          <p>
            <b>Tổng thanh toán:</b> {formatCurrencyVND(totalAmount)}
          </p>
        </>
      ),
      okText: 'Thanh toán',
      cancelText: 'Hủy',
      async onOk() {
        confirmOpen.current = false;
        setLoading(true);
        try { await onCreate(totalAmount); }
        finally { setLoading(false); }
      },
      onCancel: () => { confirmOpen.current = false; },
    });
  };

  const columns: ColumnsType<CustomerResponse> = [
    { title: 'STT', render: (_: unknown, __: CustomerResponse, i: number) => i + 1 },
    { title: 'Tên khách hàng', dataIndex: 'fullName' },
    { title: 'Ngày sinh', dataIndex: 'dateOfBirth', render: (v: string) => (v ? formatDate(v) : '—') },
    {
      title: 'Thể loại',
      dataIndex: 'bookingType',
      render: (v: string) => passengerLabel(v),
    },
    { title: 'Địa chỉ', dataIndex: 'address' },
    {
      title: 'Giá tour',
      dataIndex: 'bookingType',
      render: (type: string | number) => {
        const price = quote?.unitPrices[String(type) as keyof typeof quote.unitPrices];
        return price != null ? formatCurrencyVND(Number(price)) : '--';
      },
    },
  ];

  return (
    <Card className="journey-invoice-form" variant="borderless" loading={loading}>
      <Title level={4} style={{ textAlign: 'center' }}>
        Thông tin giữ chỗ
      </Title>

      <section style={{ marginBottom: 16 }}>
        <Title level={5}>Thông tin tài khoản</Title>
        <Descriptions layout={screens.sm ? 'horizontal' : 'vertical'} size="small" bordered column={1}>
          <Descriptions.Item label="Họ tên">{account.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{account.phone}</Descriptions.Item>
        </Descriptions>
      </section>

      {tourDeparture ? (
        <section style={{ marginBottom: 16 }}>
          <Title level={5}>Thông tin chuyến đi</Title>
          <Descriptions layout={screens.sm ? 'horizontal' : 'vertical'} size="small" bordered column={1}>
            <Descriptions.Item label="Mã chuyến đi">{tourDeparture.tourCode}</Descriptions.Item>
            <Descriptions.Item label="Ngày khởi hành">
              {formatDatetime(tourDeparture.departureDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày về">
              {formatDatetime(tourDeparture.returnDate)}
            </Descriptions.Item>

          </Descriptions>
        </section>
      ) : (
        <Alert type="info" message="Chưa có thông tin chuyến đi" showIcon />
      )}

      <Divider />
      <Title level={5}>Danh sách khách hàng</Title>
      <Table
        dataSource={customers}
        columns={columns}
        scroll={{ x: 680 }}
        pagination={false}
        rowKey={(r) => String(r.id)}
        size="small"
      />

      <Divider />
      {quote && <PriceBreakdown
        total={totalAmount}
        lines={PARTY_TYPES.flatMap(type => {
          const quantity = customers.filter(customer => customer.bookingType === type).length;
          const unitAmount = Number(quote.unitPrices[type]);
          return quantity && Number.isFinite(unitAmount)
            ? [{ label: passengerLabel(type), quantity, unitAmount, amount: quantity * unitAmount }] : [];
        })}
        note={tourPriceNote(quote.singleSupplementPrice)}
      />}
      <Divider />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Thanh toán trực tuyến qua VNPay"
        description={paymentDeadline ? `Hạn giữ chỗ: ${formatDatetime(paymentDeadline)} (giờ Việt Nam).`
          : 'Hóa đơn được tạo tự động sau khi VNPAY xác nhận giao dịch thành công.'}
      />

      <Button type="primary" className="bg-[#21776D]!" block size="large" loading={loading} disabled={!customers.length || !quote || totalAmount <= 0} onClick={handleSubmit}>
        Thanh toán qua VNPAY
      </Button>

      <Button type="text" block size="large" onClick={() => navigate('/')}>
        Quay về trang chủ
      </Button>
    </Card>
  );
}

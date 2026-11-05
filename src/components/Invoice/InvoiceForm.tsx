import type { CustomerResponse } from '@/types/Booking';
import type { ColumnsType } from 'antd/es/table';
import {
  Card,
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
import { passengerLabel } from '@/utils/booking';
// import type { CustomerResponse } from "@/types/Booking";
// import type { ITourDeparture } from "@/types/Tour";
import type { InvoiceFormProps } from '@/types/Invoice';

const { Title, Text } = Typography;

export default function InvoiceForm({
  account,
  customers = [],
  tourDeparture,
  quote,
  onCreate,
}: InvoiceFormProps) {
  const navigate = useNavigate();
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
    <Card loading={loading}>
      <Title level={4} style={{ textAlign: 'center' }}>
        Hóa đơn thanh toán
      </Title>

      <section style={{ marginBottom: 16 }}>
        <Title level={5}>Thông tin tài khoản</Title>
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="Họ tên">{account.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{account.phone}</Descriptions.Item>
        </Descriptions>
      </section>

      {tourDeparture ? (
        <section style={{ marginBottom: 16 }}>
          <Title level={5}>Thông tin chuyến đi</Title>
          <Descriptions size="small" bordered column={1}>
            <Descriptions.Item label="Mã chuyến đi">{tourDeparture.tourCode}</Descriptions.Item>
            <Descriptions.Item label="Ngày khởi hành">
              {formatDatetime(tourDeparture.departureDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày về">
              {formatDatetime(tourDeparture.returnDate)}
            </Descriptions.Item>
            {/* Pricing may be unavailable while the departure itself is still readable. */}
            {tourDeparture.tourPrice ? (
              <>
                <Descriptions.Item label="Giá vé người lớn">
                  {formatCurrencyVND(tourDeparture.tourPrice.adultPrice)}
                </Descriptions.Item>
                <Descriptions.Item label="Giá vé trẻ em">
                  {formatCurrencyVND(tourDeparture.tourPrice.childPrice)}
                </Descriptions.Item>
                <Descriptions.Item label="Giá phòng đơn tham khảo (chưa áp dụng)">
                  {formatCurrencyVND(tourDeparture.tourPrice.singleSupplementPrice)}
                </Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="Giá vé">Đang cập nhật</Descriptions.Item>
            )}
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
        pagination={false}
        rowKey={(r) => String(r.id)}
        size="small"
      />

      <Divider />
      <Title level={5}>Tổng thanh toán hóa đơn</Title>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Tổng cộng">
          <Text strong type="success" style={{ fontSize: 16 }}>
            {formatCurrencyVND(totalAmount)}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Thanh toán trực tuyến qua VNPay"
        description="Hóa đơn được tạo tự động sau khi VNPay xác nhận giao dịch thành công."
      />

      <Button type="primary" className="bg-[#7BBCB0]!" block size="large" loading={loading} disabled={!customers.length || !quote || totalAmount <= 0} onClick={handleSubmit}>
        Thanh toán
      </Button>

      <Button type="text" block size="large" onClick={() => navigate('/')}>
        Quay về trang chủ
      </Button>
    </Card>
  );
}

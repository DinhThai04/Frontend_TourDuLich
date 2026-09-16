import {
  Card,
  Typography,
  Table,
  Select,
  Form,
  Button,
  Modal,
  Descriptions,
  Divider,
  Alert,
} from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND, formatDatetime } from '@/utils';
// import type { CustomerResponse } from "@/types/Booking";
// import type { ITourDeparture } from "@/types/Tour";
import type { InvoiceFormProps } from '@/types/Invoice';

const { Title, Text } = Typography;
const { Option } = Select;

// interface InvoiceFormProps {
//   account: { fullName: string; email: string; phone: string };
//   customers?: CustomerResponse[];
//   tourDeparture?: ITourDeparture;
//   onCreate: (paymentMethod: string, totalAmount: number) => Promise<void>;
// }

export default function InvoiceForm({
  account,
  customers,
  tourDeparture,
  onCreate,
}: InvoiceFormProps) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // const [loading, setLoading] = useState(false);
  const loading = false; // CMT tạm để build

  /** 🔹 Tính tổng tiền khách hàng */
  const baseAmount = useMemo(() => {
    if (!customers || !tourDeparture?.tourPrice) return 0;
    const priceMap: Record<string, number> = {
      ADULT: tourDeparture.tourPrice.adultPrice || 0,
      CHILD: tourDeparture.tourPrice.childPrice || 0,
      TODDLER: tourDeparture.tourPrice.toddlerPrice || 0,
      INFANT: tourDeparture.tourPrice.infantPrice || 0,
    };
    return customers.reduce((sum, c) => sum + (priceMap[c.bookingType || ''] || 0), 0);
  }, [customers, tourDeparture]);

  const totalAmount = useMemo(
    () => baseAmount + (tourDeparture?.tourPrice.singleSupplementPrice || 0),
    [baseAmount, tourDeparture]
  );

  /** 🔹 Submit handler */
  const handleSubmit = async (values: { paymentMethod: string }) => {
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
        await onCreate(values.paymentMethod, totalAmount);
      },
    });
  };

  const columns = [
    { title: 'STT', render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Tên khách hàng', dataIndex: 'fullName' },
    { title: 'Ngày sinh', dataIndex: 'dateOfBirth' },
    {
      title: 'Thể loại',
      dataIndex: 'bookingType',
      render: (v: string) =>
        ({ ADULT: 'Người lớn', CHILD: 'Trẻ em', TODDLER: 'Em bé', INFANT: 'Trẻ sơ sinh' })[v] ||
        '--',
    },
    { title: 'Địa chỉ', dataIndex: 'address' },
    {
      title: 'Giá tour',
      dataIndex: 'bookingType',
      render: (type: string | number) => {
        const map: Record<string, number | undefined> = {
          ADULT: tourDeparture?.tourPrice.adultPrice,
          CHILD: tourDeparture?.tourPrice.childPrice,
          TODDLER: tourDeparture?.tourPrice.toddlerPrice,
          INFANT: tourDeparture?.tourPrice.infantPrice,
        };
        const price = map[String(type)];
        return price ? formatCurrencyVND(price) : '--';
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
            <Descriptions.Item label="Giá vé người lớn">
              {formatCurrencyVND(tourDeparture.tourPrice.adultPrice)}
            </Descriptions.Item>
            <Descriptions.Item label="Giá vé trẻ em">
              {formatCurrencyVND(tourDeparture.tourPrice.childPrice)}
            </Descriptions.Item>
            <Descriptions.Item label="Phụ phí">
              {formatCurrencyVND(tourDeparture.tourPrice.singleSupplementPrice)}
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
        pagination={false}
        rowKey={(r) => `${r.fullName}-${r.birthdate}`}
        size="small"
      />

      <Divider />
      <Title level={5}>Tổng thanh toán hóa đơn</Title>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Tổng tiền tour">
          {formatCurrencyVND(baseAmount)}
        </Descriptions.Item>
        <Descriptions.Item label="Phụ phí">
          {formatCurrencyVND(Number(tourDeparture?.tourPrice.singleSupplementPrice))}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng cộng">
          <Text strong type="success" style={{ fontSize: 16 }}>
            {formatCurrencyVND(totalAmount)}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Phương thức thanh toán"
          name="paymentMethod"
          rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
        >
          <Select placeholder="Chọn phương thức thanh toán">
            <Option value="cash">Tiền mặt</Option>
            {/* <Option value="momo">Ví MoMo</Option> */}
            <Option value="vnpay">VN Pay</Option>
          </Select>
        </Form.Item>

        <Button type="primary" className="bg-[#7BBCB0]!" htmlType="submit" block size="large">
          Thanh toán
        </Button>

        <Button type="text" block size="large" onClick={() => navigate('/')}>
          Quay về trang chủ
        </Button>
      </Form>
    </Card>
  );
}

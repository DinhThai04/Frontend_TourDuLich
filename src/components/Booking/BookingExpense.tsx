import type { PassengerType } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { Typography, Row, Col, Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { unitPriceFor } from '@/utils/booking';
import { formatCurrencyVND } from '@/utils/index';
const { Title, Text } = Typography;

export type ExpenseItem = {
  type: PassengerType;
  label: string;
  quantity: number;
};

type BookingExpenseProps = {
  items: ExpenseItem[];
  /** Bảng giá của chuyến đi, dùng chung với bước kiểm tra chuyến để tránh gọi API lần hai. */
  tourPrice?: ITourPrice | null;
  onConfirm?: () => void | Promise<void>;
};

export default function BookingExpense({ items, tourPrice, onConfirm }: BookingExpenseProps) {
  const navigate = useNavigate();
  const calculatedTotal = useMemo(
    () => items.reduce((sum, item) => sum + unitPriceFor(item.type, tourPrice) * item.quantity, 0),
    [items, tourPrice],
  );

  const handleConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đặt tour',
      content: 'Bạn có chắc chắn muốn đặt tour này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await Promise.resolve(onConfirm?.());
        } catch (err: unknown) {
          message.error(errorMessage(err) || 'Đặt tour thất bại');
          throw err;
        }
      },
    });
  };

  return (
    <>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>CHI PHÍ HÀNH KHÁCH</Title>
        </Col>
        <Col>
          <Title
            level={3}
            style={{ fontFamily: 'sans-serif', color: '#7BBCB0', margin: 0, fontWeight: 'bold' }}
          >
            {formatCurrencyVND(calculatedTotal)}
          </Title>
        </Col>
      </Row>

      <div style={{ marginTop: '12px' }}>
        {items.map((item) => (
          <Row key={item.type} justify="space-between" style={{ marginBottom: '6px' }}>
            <Col>
              <Text>{item.label}</Text>
            </Col>
            <Col>
              <Text>
                {item.quantity} x {formatCurrencyVND(unitPriceFor(item.type, tourPrice))}
              </Text>
            </Col>
          </Row>
        ))}

        <Row justify="space-between">
          <Col>
            <Text>Phụ thu phòng đơn</Text>
          </Col>
          <Col>
            <Text className="text-[#7BBCB0]!">Chưa áp dụng</Text>
          </Col>
        </Row>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Button
          type="link"
          className="text-[#7BBCB0]!"
          block
          size="large"
          onClick={() => navigate('/profile')}
        >
          Lịch sử đặt tour
        </Button>
        <Button type="primary" className="bg-[#7BBCB0]!" block size="large" onClick={handleConfirm}>
          Thanh toán
        </Button>
      </div>
    </>
  );
}

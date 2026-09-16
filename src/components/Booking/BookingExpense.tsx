import { Typography, Row, Col, Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getTourDepartureById } from '@/services/tourServices';
import { formatCurrencyVND } from '@/utils/index';
const { Title, Text } = Typography;

type BookingExpenseProps = {
  items: { label: string; quantity: number; price: number }[];
  onConfirm?: () => void | Promise<void>;
  tourDepartureId?: number | string;
};

export default function BookingExpense({ items, onConfirm, tourDepartureId }: BookingExpenseProps) {
  const navigate = useNavigate();
  const [tourPrice, setTourPrice] = useState<any | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!tourDepartureId) return;
      try {
        const id = typeof tourDepartureId === 'string' ? Number(tourDepartureId) : tourDepartureId;
        const resp = await getTourDepartureById(Number(id));
        setTourPrice(resp.result?.tourPrice || null);
      } catch (err) {
        console.error('Failed to load tour departure', err);
      }
    };
    load();
  }, [tourDepartureId]);

  useEffect(() => {
    const priceFromLabel = (label: string, defaultPrice: number) => {
      if (!tourPrice) return defaultPrice;
      const l = label.toLowerCase();
      if (l.includes('người lớn')) return tourPrice.adultPrice;
      if (l.includes('trẻ em')) return tourPrice.childPrice;
      if (l.includes('trẻ nhỏ')) return tourPrice.toddlerPrice;
      if (l.includes('em bé')) return tourPrice.infantPrice;
      return defaultPrice;
    };
    const itemsTotal = items.reduce((sum, it) => {
      const unit = priceFromLabel(it.label, it.price);
      return sum + unit * it.quantity;
    }, 0);

    const singleRoomSurcharge = tourPrice?.singleSupplementPrice ?? 0;

    setCalculatedTotal(itemsTotal + singleRoomSurcharge);
  }, [tourPrice, items]);

  const handleConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đặt tour',
      content: 'Bạn có chắc chắn muốn đặt tour này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await Promise.resolve(onConfirm?.());
        } catch (err: any) {
          message.error(err?.message || 'Đặt tour thất bại');
          throw err;
        }
      },
    });
  };

  return (
    <>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>KHÁCH HÀNG + PHỤ THU</Title>
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
        {items.map((item, index) => {
          const unitPrice = ((): number => {
            if (!tourPrice) return item.price;
            const l = item.label.toLowerCase();
            if (l.includes('người lớn')) return tourPrice.adultPrice;
            if (l.includes('trẻ em')) return tourPrice.childPrice;
            if (l.includes('trẻ nhỏ')) return tourPrice.toddlerPrice;
            if (l.includes('em bé')) return tourPrice.infantPrice;
            return item.price;
          })();
          return (
            <Row key={index} justify="space-between" style={{ marginBottom: '6px' }}>
              <Col>
                <Text>{item.label}</Text>
              </Col>
              <Col>
                <Text>
                  {item.quantity} x {formatCurrencyVND(unitPrice)}
                </Text>
              </Col>
            </Row>
          );
        })}

        <Row justify="space-between">
          <Col>
            <Text>Phụ thu phòng đơn</Text>
          </Col>
          <Col>
            <Text className="text-[#7BBCB0]!">
              {formatCurrencyVND(tourPrice?.singleSupplementPrice ?? 0)}
            </Text>
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

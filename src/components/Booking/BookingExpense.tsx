import PriceBreakdown from '@/components/Share/PriceBreakdown';
import type { PassengerType } from '@/types/Booking';
import type { ITourPrice } from '@/types/Tour';
import { errorMessage } from '@/utils/errors';
import { Button, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMemo, useRef } from 'react';
import { tourPriceNote, unitPriceFor } from '@/utils/booking';

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
  onCloseConfirmation?: () => void;
};

export default function BookingExpense({ items, tourPrice, onConfirm, onCloseConfirmation }: BookingExpenseProps) {
  const navigate = useNavigate();
  const confirmOpen = useRef(false);
  const calculatedTotal = useMemo(
    () => items.reduce((sum, item) => sum + unitPriceFor(item.type, tourPrice) * item.quantity, 0),
    [items, tourPrice],
  );

  const handleConfirm = () => {
    if (confirmOpen.current) return;
    confirmOpen.current = true;
    Modal.confirm({
      afterClose: () => {
        confirmOpen.current = false;
        onCloseConfirmation?.();
      },
      focusTriggerAfterClose: false,
      title: 'Xác nhận đặt tour',
      content: 'Tiếp tục để tạo yêu cầu giữ chỗ. Bạn sẽ xem hạn thanh toán và thanh toán ở bước tiếp theo.',
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
      <PriceBreakdown estimated total={calculatedTotal}
        lines={items.map(item => {
          const unitAmount = unitPriceFor(item.type, tourPrice);
          return { label: item.label, quantity: item.quantity, unitAmount, amount: unitAmount * item.quantity };
        })}
        note={tourPriceNote(tourPrice?.singleSupplementPrice)} />

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Button
          type="link"
          className="text-[#21776D]!"
          block
          size="large"
          onClick={() => navigate('/profile')}
        >
          Lịch sử đặt tour
        </Button>
        <Button type="primary" className="bg-[#21776D]!" block size="large" onClick={handleConfirm}>
          Tiếp tục giữ chỗ
        </Button>
      </div>
    </>
  );
}

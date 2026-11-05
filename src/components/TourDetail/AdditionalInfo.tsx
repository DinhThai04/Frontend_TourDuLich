import { Descriptions, Typography } from 'antd';
import type { ITour } from '@/types/Tour';

export default function AdditionalInfo({ tour }: { tour?: ITour | null }) {
  return <section style={{ marginTop: 32 }}>
    <Typography.Title level={4}>Thông tin thêm về chuyến đi</Typography.Title>
    <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={[
      { key: 'from', label: 'Điểm khởi hành', children: tour?.departureCity?.city || 'Đang cập nhật' },
      { key: 'to', label: 'Điểm đến', children: tour?.destinationCity?.city || 'Đang cập nhật' },
      { key: 'duration', label: 'Thời lượng', children: tour?.duration ? `${tour.duration} ngày` : 'Đang cập nhật' },
      { key: 'vehicle', label: 'Phương tiện', children: tour?.vehicle?.name || 'Đang cập nhật' },
    ]} />
    <Typography.Paragraph style={{ marginTop: 12 }}>
      Điểm tham quan và các hoạt động được trình bày trong lịch trình của tour bên dưới.
      Thông tin khách sạn, bữa ăn và điểm tập trung chưa được công bố cần được xác nhận với SGU Tour.
    </Typography.Paragraph>
  </section>;
}

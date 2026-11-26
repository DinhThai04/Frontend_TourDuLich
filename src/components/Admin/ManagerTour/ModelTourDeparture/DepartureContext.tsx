import { formatAdminDatetime as formatDatetime } from '@/components/Admin/Shared/adminDate';
import { Alert, Descriptions, Skeleton } from 'antd';
import { useApiQuery } from '@/hooks';
import { getTourById } from '@/services/tourServices';
import type { ITourDeparture } from '@/types/Tour';

export default function DepartureContext({ tourId, departure }: { tourId: number; departure?: ITourDeparture }) {
  const { data: tour, loading, error } = useApiQuery(async () => {
    const response = await getTourById(tourId);
    if (response.code !== 1000 || !response.result) throw new Error('Chưa tải được thông tin tour');
    return response.result;
  }, { deps: [tourId] });

  return <aside className="admin-detail-panel">
    <h3>Thông tin đối chiếu</h3>
    {loading && <Skeleton active title={false} paragraph={{ rows: 2 }} />}
    {error && <Alert type="warning" message={error} showIcon />}
    <Descriptions size="small" column={1} items={[
      { key: 'tour', label: 'Tour', children: tour?.tourTitle || `#${tourId}` },
      ...(tour ? [
        { key: 'route', label: 'Tuyến', children: [tour.departureCity?.city, tour.destinationCity?.city].filter(Boolean).join(' → ') || '—' },
        { key: 'vehicle', label: 'Phương tiện', children: tour.vehicle?.name || '—' },
      ] : []),
      ...(departure ? [
        { key: 'departure', label: 'Mã lịch', children: departure.tourCode || `#${departure.id}` },
        { key: 'date', label: 'Khởi hành', children: formatDatetime(departure.departureDate) },
        { key: 'return', label: 'Trở về', children: formatDatetime(departure.returnDate) },
        { key: 'seats', label: 'Chỗ còn', children: departure.availableSeats },
      ] : []),
    ]} />
  </aside>;
}

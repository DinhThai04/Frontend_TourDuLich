import { Alert, Button, Card, Descriptions } from 'antd';
import { Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks';
import { bookingChanges } from '@/services/bookingChangeServices';
import { getMeetingPoint, getTourById } from '@/services/tourServices';
import type { ITourDeparture } from '@/types/Tour';
import { formatDatetime } from '@/utils';

type TripPreparationProps = {
  bookingId: number;
  departure?: ITourDeparture | null;
  onViewChanges: () => void;
};

export default function TripPreparation({ bookingId, departure, onViewChanges }: TripPreparationProps) {
  const tourId = departure?.tourId;
  const departureId = departure?.id;
  const { data: meetingPoint } = useApiQuery(async () => {
    const response = await getMeetingPoint(Number(departureId));
    if (response.code !== 1000) throw new Error(response.message || 'Chưa tải được điểm tập trung');
    return response.result;
  }, { deps: [departureId], enabled: !!departureId });
  const { data: tour } = useApiQuery(async () => {
    const { code, result } = await getTourById(Number(tourId));
    if (code !== 1000) throw new Error('Chưa tải được thông tin tour');
    return result;
  }, { enabled: !!tourId, deps: [tourId] });
  const { data: changes, error: changeError, refresh: refreshChanges } = useApiQuery(
    () => bookingChanges.mine(bookingId), { deps: [bookingId] },
  );
  const activeChange = changes?.find(change => change.active_key != null
    && ['PENDING', 'ACCEPTED', 'SUPPORT_REQUIRED'].includes(change.status));
  const appliedChange = changes?.find(change => change.status === 'APPROVED'
    && Number(change.target_departure_id) === Number(departure?.id));
  const suspended = departure?.operationalStatus === 'SUSPENDED' || departure?.operationalStatus === 'CANCELLED';

  return <Card size="small" title={tour?.tourTitle ? 'Chuẩn bị cho chuyến đi · ' + tour.tourTitle : 'Chuẩn bị cho chuyến đi'}
    className="!my-4">
    {(activeChange || suspended) && <Alert type="warning" showIcon className="!mb-3"
      message={suspended ? 'Lịch trên đơn hiện đã dừng' : 'Đơn có yêu cầu dời lịch đang xử lý'}
      description={activeChange?.kind === 'SHOP' ? `Lịch được đề xuất ${formatDatetime(activeChange.target_departure_at)}. Xem yêu cầu để kiểm tra thông tin và phản hồi.`
        : suspended ? 'Hãy kiểm tra yêu cầu dời lịch hoặc liên hệ SGU Tour để xác nhận trước khi đến điểm tập trung.' : undefined}
      action={<Button size="small" onClick={onViewChanges}>Xem dời lịch</Button>} />}
    {!suspended && !activeChange && appliedChange && <Alert type="info" showIcon className="!mb-3"
      message="Đơn đã được chuyển sang lịch mới"
      description={`Lịch cũ ${formatDatetime(appliedChange.source_departure_at)}.`}
      action={<Button size="small" onClick={onViewChanges}>Xem dời lịch</Button>} />}
    {changeError && <Alert type="warning" className="!mb-3" message="Chưa kiểm tra được thay đổi lịch"
      action={<Button size="small" onClick={() => void refreshChanges()}>Thử lại</Button>} />}

    <Descriptions column={1} size="small">
      <Descriptions.Item label={suspended ? 'Giờ khởi hành cũ' : 'Giờ khởi hành'}>
        {departure?.departureDate ? `${formatDatetime(departure.departureDate)} (giờ Việt Nam)` : 'Chưa tải được lịch khởi hành'}
      </Descriptions.Item>
      {tour?.departureCity?.city && <Descriptions.Item label="Nơi khởi hành">{tour.departureCity.city}</Descriptions.Item>}
      <Descriptions.Item label="Điểm tập trung">
        {meetingPoint?.address && !suspended ? <div>
          <p>{meetingPoint.address}</p>
          {meetingPoint.landmark && <p>{meetingPoint.landmark}</p>}
          {meetingPoint.arrivalTime && <p>Giờ có mặt {meetingPoint.arrivalTime.slice(0, 5)}</p>}
          {meetingPoint.directionsUrl?.startsWith('https://') &&
            <a href={meetingPoint.directionsUrl} target="_blank" rel="noreferrer">Mở chỉ đường</a>}
        </div> : <Link to="/policies#ho-tro">Liên hệ SGU Tour để xác nhận địa chỉ</Link>}
      </Descriptions.Item>
      {tour?.vehicle?.name && <Descriptions.Item label="Phương tiện">{tour.vehicle.name}</Descriptions.Item>}
    </Descriptions>

    <div className="mt-2 flex flex-wrap gap-3">
      {tourId && <Link to={`/tours/detail/${tourId}#lich-trinh`}>Xem lịch trình từng ngày</Link>}
    </div>
  </Card>;
}

import type { AdminTourBreadcrumb } from './LayoutAdmin';
import { useEffect } from 'react';
import { Alert, Card, Descriptions, Empty, Image, Select, Skeleton, Tabs } from 'antd';
import { Outlet, useOutletContext, useLocation, useNavigate, useParams } from 'react-router-dom';
import AdminPageHeader from '@/components/Admin/Shared/AdminPageHeader';
import { getAllTours, getTourById } from '@/services/tourServices';
import { useApiQuery } from '@/hooks';
import { useHasPermission } from '@/config/useHasPermission';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
import { formatCurrencyVND } from '@/utils';
import AdminResult from './AdminResult';

export default function TourWorkspace() {
  const setBreadcrumb = useOutletContext<(value?: AdminTourBreadcrumb) => void>();
  const { tourId } = useParams();
  const id = Number(tourId);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canList = useHasPermission(P.TOURS.GET_LIST);
  const canItinerary = useHasPermission(P.ITINERARIES.GET_BY_TOUR);
  const canDepartures = useHasPermission(P.TOUR_DEPARTURES.GET_LIST);
  const canReviews = useHasPermission(P.REVIEWS.GET_LIST);
  const base = `/admin/tours/${id}`;
  const tab = pathname.slice(base.length).split('/')[1] || 'overview';
  const tabLabels: Record<string, string> = { overview: 'Tổng quan', itinerary: 'Lịch trình', departures: 'Lịch khởi hành', images: 'Hình ảnh', reviews: 'Đánh giá' };
  const tabLabel = tabLabels[tab] || 'Tour';
  const { data, loading, error, refresh } = useApiQuery(async () => {
    const response = await getTourById(id);
    if (response.code !== 1000 || !response.result) return null;
    return response.result;
  }, { enabled: Number.isSafeInteger(id) && id > 0, deps: [id] });
  const { data: choices = [] } = useApiQuery(async () => {
    const response = await getAllTours();
    return response.code === 1000 ? response.result : [];
  }, { enabled: canList });
  useEffect(() => {
    if (data?.id !== id) return;
    localStorage.setItem('sgu-admin-recent-tour', String(id));
    setBreadcrumb({ id, name: data.tourTitle, tab: tabLabel });
    return () => setBreadcrumb(undefined);
  }, [data, id, setBreadcrumb, tabLabel]);
  if (!Number.isSafeInteger(id) || id < 1 || data === null || (error && /404|không tìm thấy/i.test(error))) return <AdminResult status={404} />;
  if (error) return <Alert type="error" showIcon message={error} action={<button onClick={() => void refresh()}>Thử lại</button>} />;
  if (loading || !data) return <Skeleton active />;
  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    ...(canItinerary ? [{ key: 'itinerary', label: 'Lịch trình' }] : []),
    ...(canDepartures ? [{ key: 'departures', label: 'Lịch khởi hành' }] : []),
    { key: 'images', label: `Hình ảnh (${data.imageIds?.length ?? 0})` },
    ...(canReviews ? [{ key: 'reviews', label: 'Đánh giá' }] : []),
  ];
  return <div className="admin-dashboard">
    <AdminPageHeader title={data.tourTitle} description={`Tour #${id} · ${data.tourProgram || 'Mã chương trình chưa có'}`}
      actions={canList && <Select aria-label="Đổi tour" popupMatchSelectWidth={false} styles={{ popup: { root: { minWidth: 440 } } }} showSearch optionFilterProp="label" placeholder="Đổi tour"
        options={choices.map(tour => ({ value: tour.id, label: `${tour.tourTitle} · ${tour.tourProgram || `#${tour.id}`}`, disabled: tour.id === id }))}
        onChange={next => navigate(`/admin/tours/${next}${tab === 'overview' ? '' : `/${tab}`}`)} />} />
    <Tabs activeKey={tab} items={tabs} onChange={next => navigate(next === 'overview' ? base : `${base}/${next}`)} />
    {tab === 'overview' ? <Card><Descriptions column={{ xs: 1, sm: 2 }} items={[
      { key: 'program', label: 'Mã chương trình', children: data.tourProgram || '—' },
      { key: 'title', label: 'Tiêu đề', children: data.tourTitle },
      { key: 'origin', label: 'Điểm khởi hành', children: data.departureCity?.city || '—' },
      { key: 'destination', label: 'Điểm đến', children: data.destinationCity?.city || '—' },
      { key: 'vehicle', label: 'Phương tiện', children: data.vehicle?.name || '—' },
      { key: 'duration', label: 'Thời lượng', children: `${data.duration} ngày ${Math.max(0, data.duration - 1)} đêm` },
      { key: 'price', label: 'Giá từ', children: formatCurrencyVND(data.basePrice) },
      { key: 'description', label: 'Mô tả', children: data.description },
    ]} />
    {data.tourPrice && <section className="admin-overview-block"><h2>Bảng giá</h2><Descriptions column={{ xs: 1, sm: 2 }} items={[
      { label: 'Người lớn', children: formatCurrencyVND(data.tourPrice.adultPrice) },
      { label: 'Trẻ em', children: formatCurrencyVND(data.tourPrice.childPrice) },
      { label: 'Trẻ nhỏ', children: formatCurrencyVND(data.tourPrice.toddlerPrice) },
      { label: 'Em bé', children: formatCurrencyVND(data.tourPrice.infantPrice) },
      { label: 'Phụ thu phòng đơn', children: formatCurrencyVND(data.tourPrice.singleSupplementPrice) },
    ]} /></section>}
    {!!data.imageIds?.length && <section className="admin-overview-block"><h2>Ảnh tour</h2><Image.PreviewGroup>
      <div className="admin-tour-images admin-overview-images">{data.imageIds.map((image, index) => <figure key={`${image}-${index}`}>
        <Image src={image} alt={`Ảnh tour ${index + 1}`} width="100%" /><figcaption>Ảnh {index + 1}</figcaption>
      </figure>)}</div>
    </Image.PreviewGroup></section>}
    </Card> : tab === 'images' ? <Card>{data.imageIds?.length ?
      <Image.PreviewGroup><div className="admin-tour-images">{data.imageIds.map((src, i) =>
        <Image src={src} alt={`Ảnh tour ${i + 1}`} width="100%" key={`${src}-${i}`} />)}</div></Image.PreviewGroup>
      : <Empty description="Tour chưa có ảnh" />}</Card> : <Outlet />}
  </div>;
}

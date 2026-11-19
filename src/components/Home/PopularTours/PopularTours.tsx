import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Empty, Skeleton } from 'antd';
import Container from '@/components/Share/Container';
import TourCard from './TourCard';
import HomeRail from '../HomeRail';
import { tourInterests as groups } from '../tourInterests';
import { useHomeCatalog } from '../homeCatalogContext';
import { useLocation } from 'react-router-dom';
export default function PopularTours() {
  const { tours, status, retry } = useHomeCatalog();
  const loading = status === 'loading';
  const error = status === 'error';
  const [chosenGroup, setGroup] = useState<string | null>(null);
  const { search } = useLocation();
  const requestedGroup = new URLSearchParams(search).get('experience') ?? 'all';
  const group = chosenGroup ?? requestedGroup;
  const navigate = useNavigate();
  const availableGroups = useMemo(() => groups.filter(item => tours.some(item.matches)), [tours]);
  const shown = group === 'all' ? tours.slice(0, 6) : tours.filter(tour => groups.find(item => item.id === group)?.matches(tour));
  const handleBooking = useCallback((id: number) => navigate(`/tours/detail/${id}`), [navigate]);
  return <section className="home-section home-suggestions"><Container>
    <div className="home-section-heading"><h2>Chọn chuyến đi phù hợp với bạn</h2><p>Xem giá, thời lượng và lịch khởi hành trước khi chọn tour.</p></div>
    {!loading && !error && tours.length > 0 && <div className="home-interest-filters" role="group" aria-label="Lọc các tour gợi ý">
      <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>Tất cả</button>
      {availableGroups.map(item => <button type="button" key={item.id} aria-pressed={group === item.id} onClick={() => setGroup(item.id)}>{item.label}</button>)}
    </div>}
    {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : error ? <Alert type="warning" showIcon message="Chưa tải được tour gợi ý" action={<Button onClick={retry}>Thử lại</Button>} /> : shown.length === 0 ? <Empty description="Chưa có tour phù hợp để gợi ý" /> : <HomeRail label="Tour gợi ý" key={group} resetKey={group} delay={5200}>{shown.map(tour => <TourCard key={tour.id} tour={tour} onBooking={handleBooking} />)}</HomeRail>}
    <div className="home-view-all"><Button type="primary" size="large" onClick={() => navigate('/tours')}>Xem tất cả tour</Button></div>
  </Container></section>;
}

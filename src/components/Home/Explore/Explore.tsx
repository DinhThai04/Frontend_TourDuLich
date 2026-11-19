import Container from '@/components/Share/Container';
import { getRandom7Destinations } from '@/services/tourServices';
import type { ILocation } from '@/types/Tour';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import { Alert, Button, Empty, Skeleton } from 'antd';
import HomeRail from '../HomeRail';

export default function Explore() {
  const [destinations, setDestinations] = useState<ILocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    void getRandom7Destinations().then(res => {
      if (!active) return;
      if (res.code !== 1000) throw new Error('Destinations unavailable');
      setDestinations(res.result);
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <section className={`home-section home-destinations ${destinations.length === 1 ? 'home-destinations--single' : ''}`}>
    <Container><div className="home-destinations-layout"><div className="home-section-heading">
      <p className="home-eyebrow">BẠN MUỐN ĐI ĐÂU?</p><h2>Điểm đến hấp dẫn</h2>
      <p>Chọn nơi bạn muốn đến, xem các tour phù hợp rồi chọn lịch khởi hành.</p>
      <Link to="/tours" className="home-text-link">Xem tất cả hành trình <span aria-hidden="true">→</span></Link>
    </div>
    {loading ? <Skeleton active /> : error ? <Alert type="warning" showIcon message="Chưa tải được điểm đến" action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> : destinations.length === 0 ? <Empty description="Chưa có điểm đến để giới thiệu" /> : <HomeRail label="Điểm đến" delay={3800} destinations>{destinations.map(dest => {
      const params = new URLSearchParams({ dest: dest.city });
      return <Link key={dest.id ?? dest.city} to={`/tours/search?${params.toString()}`} className="home-destination-card" aria-label={`Xem tour đến ${dest.city}`}>
        <ResponsiveImage src={dest.img} alt={`Điểm đến ${dest.city}`} width={640} height={400} className="home-destination-photo" />
        <div className="home-destination-caption"><h3>{dest.city}</h3><span>Xem tour tại {dest.city} <span aria-hidden="true">→</span></span></div>
      </Link>;
    })}</HomeRail>}
    </div></Container>
  </section>;
}

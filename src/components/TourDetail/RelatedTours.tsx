import { Col, Row, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { searchTours } from '@/services/tourServices';
import type { ITour } from '@/types/Tour';
import TourCard from './TourCard';

export default function RelatedTours({ tourId, destination }: { tourId: number; destination?: string }) {
  const [tours, setTours] = useState<ITour[] | null>(destination ? null : []);
  useEffect(() => {
    if (!destination) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ dest: destination, size: '4' });
    void searchTours(params, controller.signal).then(({ code, result }) => {
      if (controller.signal.aborted) return;
      setTours(code === 1000 ? result.content.filter(tour => Number(tour.id) !== Number(tourId)).slice(0, 3) : []);
    }).catch(() => { if (!controller.signal.aborted) setTours([]); });
    return () => controller.abort();
  }, [destination, tourId]);

  if (tours === null) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!tours.length) return <div className="text-center"><Link to="/tours">Khám phá các tour khác</Link></div>;
  return <Row gutter={24}>
    {tours.map(tour => <Col key={tour.id} xs={24} md={12} lg={8}><TourCard tour={tour} /></Col>)}
  </Row>;
}

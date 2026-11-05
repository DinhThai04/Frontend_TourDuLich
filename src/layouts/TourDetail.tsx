import AdditionalInfo from '@/components/TourDetail/AdditionalInfo';
import ImportantInfo from '@/components/TourDetail/ImportantInfo';
import Itinerary from '@/components/TourDetail/Itinerary';
import Schedule from '@/components/TourDetail/Schedule';
import TourCard from '@/components/TourDetail/TourCard';
import TourDetailCard from '@/components/TourDetail/TourDetailCard';
import TourImages from '@/components/TourDetail/TourImage';
import { Alert, Button, Row, Col, Skeleton, Typography } from 'antd';
import { lazy, useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getRandom3Tour, getTourById } from '@/services/tourServices';
import type { ITour } from '@/types/Tour';
import DeferredSection from '@/components/Share/DeferredSection';
const Comment = lazy(() => import('@/components/Comment/Comment'));

const { Title } = Typography;

export default function TourDetail() {
  const [dataDetailtour, setDataDetailTour] = useState<ITour | null>(null);
  const [dataRandomTour, setDataRandomTour] = useState<ITour[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { id } = useParams<{ id: string }>();
  const scheduleRef = useRef<HTMLDivElement>(null);



  const scrollToSchedule = () => {
    if (scheduleRef.current) {
      scheduleRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  useEffect(() => {
    setSelectedDepartureId(null);
    const controller = new AbortController();
    setDataDetailTour(null);
    setError(false);
    if (id) void getTourById(Number(id), controller.signal).then(response => {
      if (controller.signal.aborted) return;
      if (response.code !== 1000) throw new Error('Tour unavailable');
      setDataDetailTour(response.result);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [id, retry]);

  useEffect(() => {
    const controller = new AbortController();
    setDataRandomTour([]);
    void getRandom3Tour(id ? Number(id) : undefined, controller.signal).then(response => {
      if (!controller.signal.aborted && response.code === 1000) setDataRandomTour(response.result);
    }).catch(() => { /* Recommendations must not block the selected tour. */ });
    return () => controller.abort();
  }, [id]);

  const handleSelectDeparture = useCallback((departureId: number | null) => {
    setSelectedDepartureId(departureId);
  }, []);

  if (error) return <div className="max-w-3xl mx-auto !p-6"><Alert showIcon type="warning"
    message="Chưa tải được thông tin tour" description="Tour có thể không còn hoặc kết nối đang gián đoạn."
    action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /></div>;
  if (!dataDetailtour) return <div className="max-w-5xl mx-auto !p-6"><Skeleton active paragraph={{ rows: 12 }} /></div>;

  return (
    <div style={{ padding: '24px 12px' }}>
      <Row justify="center">
        <Col xs={24} md={22} lg={22} xl={20} xxl={16}>
          <Title level={4} style={{ marginBottom: 24, fontWeight: 700, padding: '0 12px' }}>
            {dataDetailtour?.tourTitle}
          </Title>

          <Row gutter={24}>
            <Col xs={24} lg={17}>
              {dataDetailtour && <TourImages imageIds={dataDetailtour.imageIds} />}
              <div ref={scheduleRef}>
                {dataDetailtour && (
                  <Schedule 
                    tourData={dataDetailtour} 
                    onSelectDepartureId={handleSelectDeparture}
                  />
                )}
              </div>
              <AdditionalInfo tour={dataDetailtour} />
              <Itinerary tourId={dataDetailtour?.id}/>
              <ImportantInfo />
            </Col>

            <Col xs={24} lg={7}>
              <div
                style={{
                  position: 'sticky',
                  top: 24,
                  alignSelf: 'flex-start', // đảm bảo sticky tính từ đầu Col
                }}
              >
                <TourDetailCard 
                  tourData={dataDetailtour} 
                  selectedDepartureId={selectedDepartureId}
                  onSelectDeparture={scrollToSchedule} // Truyền hàm xuống
                />
              </div>
            </Col>
          </Row>
          <DeferredSection height={400} label="đánh giá tour"><Comment /></DeferredSection>
          <Title
            level={3}
            style={{
              marginTop: 48,
              marginBottom: 24,
              fontWeight: 700,
              textAlign: 'center',
              color: '#0B5DA7',
            }}
          >
            CÁC CHƯƠNG TRÌNH KHÁC
          </Title>

          <Row gutter={24} justify="space-between">
            {dataRandomTour.map((tour) => (
              <Col key={tour.id} xs={24} md={12} lg={8}>
                <TourCard tour={tour} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
}

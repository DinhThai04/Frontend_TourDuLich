import AdditionalInfo from '@/components/TourDetail/AdditionalInfo';
import Schedule from '@/components/TourDetail/Schedule';
import TourDetailCard from '@/components/TourDetail/TourDetailCard';
import TourImages from '@/components/TourDetail/TourImage';
import { Alert, Button, Row, Col, Skeleton, Typography } from 'antd';
import { lazy, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { getTourById, getTourDepartureById } from '@/services/tourServices';
import type { ITour, ITourDeparture } from '@/types/Tour';
import DeferredSection from '@/components/Share/DeferredSection';
import { departureAdultPrice, departureIdFromSearch, isBookableDeparture } from '@/utils/tourSchedule';
import { formatCurrencyVND, parseDate } from '@/utils';
import { countParty, DEFAULT_PARTY, formatParty, parseParty } from '@/utils/booking';
import '@/components/TourDetail/tourDetail.css';
const Itinerary = lazy(() => import('@/components/TourDetail/Itinerary'));
const RelatedTours = lazy(() => import('@/components/TourDetail/RelatedTours'));
const Comment = lazy(() => import('@/components/Comment/Comment'));

const { Title } = Typography;

export default function TourDetail() {
  const [dataDetailtour, setDataDetailTour] = useState<ITour | null>(null);
  const [departureResult, setDepartureResult] = useState<{ query: string; departure: ITourDeparture | null }>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { id } = useParams<{ id: string }>();
  const { hash, key, search, state } = useLocation();
  const navigate = useNavigate();
  const setAssistantTour = useOutletContext<((tour: { id: number; title: string } | null) => void) | undefined>();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [party, setParty] = useState(() => parseParty(new URLSearchParams(search).get('party')) ?? DEFAULT_PARTY);
  const partySize = countParty(party);
  const selectedDepartureId = departureIdFromSearch(search);
  const departureQuery = `${id}:${selectedDepartureId}`;
  const departureLoading = selectedDepartureId !== null && departureResult?.query !== departureQuery;
  const selectedDeparture = selectedDepartureId !== null && !departureLoading ? departureResult?.departure ?? null : null;
  const bookable = selectedDeparture !== null && isBookableDeparture(selectedDeparture) && selectedDeparture.availableSeats >= partySize;
  const bookingLink = `/booking?departureId=${selectedDepartureId}&tourId=${id}&party=${formatParty(party)}`;

  useEffect(() => {
    if (dataDetailtour?.id !== Number(id)) return;
    if (hash === '#lich-khoi-hanh') scheduleRef.current?.scrollIntoView({ block: 'start' });
    if (hash === '#lich-trinh') document.getElementById('lich-trinh')?.scrollIntoView({ block: 'start' });
  }, [dataDetailtour, hash, id, key]);

  const scrollToSchedule = () => {
    if (scheduleRef.current) {
      scheduleRef.current.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
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
    if (dataDetailtour && Number(dataDetailtour.id) === Number(id)) {
      setAssistantTour?.({ id: Number(dataDetailtour.id), title: dataDetailtour.tourTitle });
    }
    return () => setAssistantTour?.(null);
  }, [dataDetailtour, id, setAssistantTour]);

  useEffect(() => {
    if (!selectedDepartureId || !id) return;
    const controller = new AbortController();
    setDepartureResult(undefined);
    void getTourDepartureById(selectedDepartureId, controller.signal).then(({ code, result }) => {
      const departureAt = result?.departureDate && parseDate(result.departureDate);
      if (code !== 1000 || !result || Number(result.tourId) !== Number(id) ||
        (result.operationalStatus && result.operationalStatus !== 'OPEN') ||
        !departureAt || departureAt.getTime() <= Date.now()) throw new Error('Departure unavailable');
      if (!controller.signal.aborted) setDepartureResult({ query: departureQuery, departure: result });
    }).catch(() => {
      if (!controller.signal.aborted) setDepartureResult({ query: departureQuery, departure: null });
    });
    return () => controller.abort();
  }, [departureQuery, id, selectedDepartureId]);

  const handleSelectDeparture = useCallback((departureId: number | null) => {
    if (departureId === selectedDepartureId) return;
    const params = new URLSearchParams(search);
    if (departureId) params.set('departureId', String(departureId));
    else params.delete('departureId');
    setDepartureResult(undefined);
    navigate({ search: params.toString(), hash }, { replace: true, preventScrollReset: true, state });
  }, [hash, navigate, search, selectedDepartureId, state]);

  if (error) return <div className="max-w-3xl mx-auto !p-6"><Alert showIcon type="warning"
    message="Chưa tải được thông tin tour" description="Tour có thể không còn hoặc kết nối đang gián đoạn."
    action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /></div>;
  if (!dataDetailtour || Number(dataDetailtour.id) !== Number(id)) {
    return <div className="max-w-5xl mx-auto !p-6"><Skeleton active paragraph={{ rows: 12 }} /></div>;
  }
  const adultPrice = departureAdultPrice(dataDetailtour, selectedDeparture);

  return (
    <div className="tour-detail-page">
      <Row justify="center">
        <Col xs={24} md={22} lg={22} xl={20} xxl={16}>
          <Title level={4} style={{ marginBottom: 24, fontWeight: 700, padding: '0 12px' }}>
            {dataDetailtour?.tourTitle}
          </Title>

          <Row gutter={24}>
            <Col xs={24} lg={15}>
              {dataDetailtour && <TourImages imageIds={dataDetailtour.imageIds} />}
              <div id="lich-khoi-hanh" ref={scheduleRef} style={{ scrollMarginTop: 96 }}>
                <Schedule
                  key={dataDetailtour.id}
                  tourData={dataDetailtour}
                  selectedDepartureId={selectedDepartureId}
                  selectedDeparture={selectedDeparture}
                  departureLoading={departureLoading}
                  partySize={partySize}
                  onSelectDepartureId={handleSelectDeparture}
                />
              </div>
              <AdditionalInfo tour={dataDetailtour} />
              <DeferredSection id="lich-trinh" height={240} label="lịch trình"><Itinerary tourId={dataDetailtour.id} /></DeferredSection>
            </Col>

            <Col xs={24} lg={9}>
              <div
                style={{
                  position: 'sticky',
                  top: 88,
                  alignSelf: 'flex-start',
                }}
              >
                <TourDetailCard
                  tourData={dataDetailtour}
                  selectedDeparture={selectedDeparture}
                  departureLoading={departureLoading}
                  party={party}
                  onPartyChange={setParty}
                  onSelectDeparture={scrollToSchedule}
                  onBook={() => navigate(bookingLink)}
                />
              </div>
            </Col>
          </Row>
          <div className="mt-8">
            <DeferredSection height={400} label="đánh giá tour"><Comment /></DeferredSection>
          </div>
          <Title
            id="tour-tuong-tu"
            className="scroll-mt-24"
            level={3}
            style={{
              marginTop: 48,
              marginBottom: 24,
              fontWeight: 700,
              textAlign: 'center',
              color: '#153a35',
            }}
          >
            Những hành trình khác
          </Title>

          <DeferredSection height={260} label="tour tương tự">
            <RelatedTours tourId={dataDetailtour.id} destination={dataDetailtour.destinationCity?.city} />
          </DeferredSection>
        </Col>
      </Row>
      <div className="tour-detail-mobile-bar">
        <div>
          <small>{selectedDeparture ? 'Giá người lớn' : 'Giá từ / khách'}</small>
          <strong>{adultPrice == null ? 'Đang cập nhật' : formatCurrencyVND(adultPrice)}</strong>
        </div>
        <Button type="primary" onClick={bookable ? () => navigate(bookingLink) : scrollToSchedule}>
          {bookable ? 'Đặt ngay' : selectedDeparture ? 'Xem ngày còn chỗ' : 'Xem lịch khởi hành'}
        </Button>
      </div>
    </div>
  );
}

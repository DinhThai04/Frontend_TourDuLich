import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Calendar,
  Button,
  Row,
  Col,
  List,
  Card,
  ConfigProvider,
  Typography,
  Empty,
  Spin,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { ITour, ITourDeparture } from '@/types/Tour';
import { departureCalendar, departureMonthStart, isBookableDeparture } from '@/utils/tourSchedule';
import DepartureDetailsCard from './DepartureDetailsCard';

dayjs.locale('vi');

const { Text } = Typography;

interface ScheduleProps {
  tourData: ITour;
  selectedDepartureId: number | null;
  selectedDeparture: ITourDeparture | null;
  departureLoading: boolean;
  partySize: number;
  onSelectDepartureId: (id: number | null) => void;
}

export default function Schedule({
  tourData, selectedDepartureId, selectedDeparture, departureLoading, partySize, onSelectDepartureId,
}: ScheduleProps) {
  const [calendarMonth, setCalendarMonth] = useState<string>();
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [departureUpdates, setDepartureUpdates] = useState<Record<number, ITourDeparture>>({});
  const { basePrice, departures } = tourData;
  const { dates: specialDates, months: specialMonths, upcoming, soldOutDays, closedDays } = useMemo(() => {
    const updated = (departures ?? []).map(
      item => selectedDeparture?.id === item.id ? selectedDeparture : departureUpdates[item.id] ?? item,
    );
    return departureCalendar(updated, basePrice);
  }, [departures, basePrice, selectedDeparture, departureUpdates]);
  const noBookableDeparture = closedDays.size === 0 ? 'Các lịch khởi hành sắp tới đã hết chỗ.'
    : soldOutDays.size === 0 ? 'Các lịch khởi hành sắp tới đã đóng đặt chỗ.'
      : 'Các lịch khởi hành sắp tới hiện không nhận đặt chỗ.';
  const selectedMonth = calendarMonth ?? specialMonths[0];
  const currentDate = (selectedMonth && departureMonthStart(selectedMonth)) || dayjs().startOf('month');
  const selectedTime = selectedDeparture && dayjs(selectedDeparture.departureDate);
  const alternatives = selectedTime ? upcoming
    .filter(item => item.id !== selectedDepartureId && isBookableDeparture(item) && item.availableSeats >= partySize)
    .sort((left, right) => Math.abs(selectedTime.diff(left.departureDate)) - Math.abs(selectedTime.diff(right.departureDate)))
    .slice(0, 2) : [];

  useEffect(() => {
    if (!selectedDeparture) return;
    setDepartureUpdates(previous => ({ ...previous, [selectedDeparture.id]: selectedDeparture }));
    setCalendarMonth(dayjs(selectedDeparture.departureDate).format('YYYY-MM'));
  }, [selectedDeparture]);

  const handleMonthSelect = (month: string) => {
    if (!specialMonths.includes(month)) return;
    onSelectDepartureId(null);
    setCalendarMonth(month);
  };

  const renderMonthSelector = () => (
    <Card
      styles={{ body: { padding: 10 } }}
      style={{ width: '100%', height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          whiteSpace: 'pre-line',
          textAlign: 'center',
          display: 'block',
          margin: '12px 0',
        }}
      >
        Chọn tháng
      </Text>

      <List
        dataSource={specialMonths}
        renderItem={(month: string) => (
          <List.Item>
            <Button
              type="text"
              onClick={() => handleMonthSelect(month)}
              block
              style={{
                backgroundColor: selectedMonth === month ? '#155790' : 'transparent',
                color: selectedMonth === month ? '#fff' : '#155790',
                fontWeight: 'bold',
                height: 48,
                fontSize: 16,
              }}
            >
              {departureMonthStart(month)?.format('MM/YYYY')}
            </Button>
          </List.Item>
        )}
      />
    </Card>
  );

  const renderCalendar = () => (
    <Card
      styles={{ body: { padding: '14px 18px 12px' } }}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
    >
      <ConfigProvider locale={viVN}>
        <Calendar
          fullscreen={false}
          value={currentDate}
          fullCellRender={dateCellRender}
          headerRender={({ value }) => {
            const month = dayjs(value).month();
            const year = dayjs(value).year();

            const canGoPrev = dayjs(value).isAfter(dayjs(), 'month');
            const canGoNext = dayjs(value).isBefore(dayjs().add(6, 'month'), 'month');

            return (
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#1F7A6E', textTransform: 'uppercase', marginBottom: 2 }}>
                  Lịch khởi hành
                </div>
                <Button
                  size="small"
                  aria-label="Tháng trước"
                  disabled={!canGoPrev}
                  onClick={() => {
                    const prevMonth = dayjs(currentDate).subtract(1, 'month').format('YYYY-MM');
                    handleMonthSelect(prevMonth);
                  }}
                  style={{
                    marginRight: 10,
                    border: 'none',
                    backgroundColor: canGoPrev ? '#E6F4F1' : '#eee',
                    borderRadius: 50,
                  }}
                  icon={<ArrowLeftOutlined style={{ fontSize: 14, color: '#134E48' }} />}
                />
                <span style={{ fontWeight: 'bold', fontSize: 16, color: '#134E48' }}>
                  THÁNG {month + 1}/{year}
                </span>
                <Button
                  size="small"
                  aria-label="Tháng sau"
                  disabled={!canGoNext}
                  onClick={() => {
                    const nextMonth = dayjs(currentDate).add(1, 'month').format('YYYY-MM');
                    handleMonthSelect(nextMonth);
                  }}
                  style={{
                    marginLeft: 10,
                    border: 'none',
                    backgroundColor: canGoNext ? '#E6F4F1' : '#eee',
                    borderRadius: 50,
                  }}
                  icon={<ArrowRightOutlined style={{ fontSize: 14, color: '#134E48' }} />}
                />
              </div>
            );
          }}
        />
      </ConfigProvider>
      <p
        style={{
          color: '#155e54',
          fontSize: 14,
          fontStyle: 'italic',
          fontWeight: 400,
          marginTop: 4,
          marginBottom: 0,
        }}
      >
        Quý khách vui lòng chọn ngày phù hợp
      </p>
    </Card>
  );

  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = dayjs(value).format('YYYY-MM-DD');
    const special = specialDates[dateStr];
    const soldOut = soldOutDays.has(dateStr);
    const isHover = hoverDate === dateStr;

    const cellStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      textAlign: 'center',
      padding: '3px 4px',
      borderRadius: 6,
      cursor: special ? 'pointer' : 'default',
      border: special && isHover ? '1.5px solid #1F7A6E' : '1px solid transparent',
      background: special && isHover ? '#E6F4F1' : 'transparent',
      font: 'inherit',
      color: 'inherit',
    };

    const hoverHandlers = {
      onMouseEnter: () => setHoverDate(dateStr),
      onMouseLeave: () => setHoverDate(null),
    };

    const cellContent = (
      <>
        <div style={{ fontWeight: special ? 'bold' : '450', fontSize: 15, lineHeight: 1.25 }}>
          {dayjs(value).date()}
        </div>

        <div
          className="tour-calendar-label"
          style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2, color: soldOut ? '#7a3e35' : special ? '#155e54' : 'transparent' }}
        >
          {closedDays.has(dateStr) ? 'Đóng đặt chỗ' : soldOut ? 'Hết chỗ' : special?.price || '—'}
        </div>
      </>
    );

    if (!special) {
      // fullCellRender thay toàn bộ nội dung ô lịch, nên không được aria-hidden:
      // nếu ẩn thì người dùng đọc màn hình mất luôn con số ngày của mọi ô không có tour.
      return (
        <div {...hoverHandlers} style={cellStyle}>
          {cellContent}
        </div>
      );
    }

    return (
      <button
        type="button"
        {...hoverHandlers}
        onClick={() => onSelectDepartureId(special.id)}
        aria-pressed={selectedDepartureId === special.id}
        aria-label={`Chọn ngày khởi hành ${dayjs(value).format('DD/MM/YYYY')}${special.price ? `, giá ${special.price}` : ''}`}
        style={cellStyle}
      >
        {cellContent}
      </button>
    );
  };


  return (
    <div className="mt-6">
      {specialMonths.length === 0 ? <Empty description="Tour hiện chưa có lịch khởi hành sắp tới." />
        : <>
          {!Object.keys(specialDates).length && <Alert className="!mb-3" type="info" showIcon
            message={noBookableDeparture}
            action={<Button href="#tour-tuong-tu">Xem tour tương tự</Button>} />}
          <Row gutter={[16, 12]}>
            {!selectedDeparture && <Col xs={24} md={4}>{renderMonthSelector()}</Col>}
            <Col xs={24} md={selectedDeparture ? 24 : 20}>
              <div key={selectedDepartureId || 'calendar'} className="journey-departure-state">
                {departureLoading ? <Spin /> : selectedDeparture ? <DepartureDetailsCard departure={selectedDeparture} tourData={tourData} partySize={partySize}
                  alternatives={alternatives} onSelectDepartureId={onSelectDepartureId} /> : <>
                  {selectedDepartureId !== null && <Alert className="!mb-3" type="warning" showIcon
                    message="Lịch đã chọn hiện không khả dụng. Bạn có thể chọn một ngày khác bên dưới." />}
                  {renderCalendar()}
                </>}
              </div>
            </Col>
          </Row>
        </>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Calendar,
  Button,
  Row,
  Col,
  List,
  Card,
  ConfigProvider,
  message,
  Typography,
  Divider,
  Empty,
  Spin,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { getDepartureByTourId, getTourDepartureById } from '@/services/tourServices';
import type {
  TourDepartureResponse,
  TourDeparturesResponse,
  ITour,
  ITourDeparture,
} from '@/types/Tour';
import { ArrowLeft, Bus } from 'lucide-react';
import { departureCalendar, departureMonthStart } from '@/utils/tourSchedule';
import { formatCurrencyVND } from '@/utils';

dayjs.locale('vi');

const { Title, Text } = Typography;

/** Show the departure time stored on the schedule instead of a made-up travel window. */
const clock = (value?: string | null): string =>
  value && dayjs(value).isValid() ? dayjs(value).format('HH:mm') : '—';

const vnd = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? formatCurrencyVND(value) : '—';

interface ScheduleProps {
  // tourId?: number;
  // basePrice?: number;
  tourData?: ITour | null;
  onSelectDepartureId?: (id: number | null) => void;
}

export default function Schedule({ tourData, onSelectDepartureId }: ScheduleProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [currentDate, setCurrentDate] = useState(dayjs().startOf('month'));
  const [loadingDepartures, setLoadingDepartures] = useState(true);
  const [departureError, setDepartureError] = useState(false);
  const [specialDates, setSpecialDates] = useState<Record<string, { id: number; price: string }>>(
    {}
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [specialMonths, setSpecialMonths] = useState<string[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);
  const [dataDetailTourDeparture, setDataDetailTourDeparture] = useState<ITourDeparture | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    setSelectedDepartureId(null);
    onSelectDepartureId?.(null);
    setDataDetailTourDeparture(null);
    setSpecialDates({});
    setSpecialMonths([]);
    setSelectedMonth(undefined);
    setCurrentDate(dayjs().startOf('month'));
    setDepartureError(false);
    setLoadingDepartures(true);
    if (!tourData?.id) { setLoadingDepartures(false); return; }
    getDepartureByTourId(Number(tourData.id))
      .then((data: TourDeparturesResponse) => {
        if (cancelled) return;
        const calendar = departureCalendar(data.result || [], tourData.basePrice);
        setSpecialDates(calendar.dates);
        setSpecialMonths(calendar.months);
        setSelectedMonth(calendar.months[0]);
        const firstMonth = calendar.months[0] && departureMonthStart(calendar.months[0]);
        setCurrentDate(firstMonth || dayjs().startOf('month'));
      })
      .catch(() => { if (!cancelled) setDepartureError(true); })
      .finally(() => { if (!cancelled) setLoadingDepartures(false); });
    return () => { cancelled = true; };
  }, [tourData, onSelectDepartureId]);

  useEffect(() => {
    let cancelled = false;
    setDataDetailTourDeparture(null);
    if (!selectedDepartureId) return;
    getTourDepartureById(selectedDepartureId)
      .then((data: TourDepartureResponse) => { if (!cancelled) setDataDetailTourDeparture(data.result); })
      .catch(() => {
        if (!cancelled) {
          setSelectedDepartureId(null); onSelectDepartureId?.(null);
          // Nếu chỉ âm thầm nhả chọn thì người dùng bấm ngày mà không hiểu vì sao lịch biến mất
          // (đang hết hạn, bị ngưng hoặc đã bán hết ngay sau khi tải danh sách).
          message.error('Chưa tải được lịch khởi hành này. Vui lòng chọn ngày khác hoặc tải lại trang.');
        }
      });
    return () => { cancelled = true; };
  }, [selectedDepartureId, onSelectDepartureId]);

  const handleMonthSelect = (month: string) => {
    const firstDay = departureMonthStart(month);
    if (!firstDay || !specialMonths.includes(month)) return;
    setSelectedDepartureId(null);
    onSelectDepartureId?.(null);
    setSelectedMonth(month);
    setCurrentDate(firstDay);
  };

  //  Hàm render danh sách tháng
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

  //  Hàm render Calendar
  const renderCalendar = () => (
    <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
      <ConfigProvider locale={viVN}>
        <Calendar
          fullscreen={false}
          value={currentDate}
          onPanelChange={(val) => setCurrentDate(dayjs(val))}
          fullCellRender={dateCellRender}
          headerRender={({ value }) => {
            const month = dayjs(value).month();
            const year = dayjs(value).year();

            const prevMonthStr = dayjs(value).subtract(1, 'month').format('YYYY-MM');
            const nextMonthStr = dayjs(value).add(1, 'month').format('YYYY-MM');

            const canGoPrev = specialMonths?.includes(prevMonthStr);
            const canGoNext = specialMonths?.includes(nextMonthStr);

            return (
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <Button
                  size="large"
                  disabled={!canGoPrev}
                  onClick={() => {
                    const prevMonth = dayjs(currentDate).subtract(1, 'month').format('YYYY-MM');
                    handleMonthSelect(prevMonth);
                  }}
                  style={{
                    marginRight: 10,
                    border: 'none',
                    backgroundColor: canGoPrev ? '#F0F0F0' : '#ddd',
                    borderRadius: 50,
                  }}
                  icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
                />
                <span style={{ fontWeight: 'bold', fontSize: 20, color: '#155790' }}>
                  THÁNG {month + 1}/{year}
                </span>
                <Button
                  size="large"
                  disabled={!canGoNext}
                  onClick={() => {
                    const nextMonth = dayjs(currentDate).add(1, 'month').format('YYYY-MM');
                    handleMonthSelect(nextMonth);
                  }}
                  style={{
                    marginLeft: 10,
                    border: 'none',
                    backgroundColor: canGoNext ? '#F0F0F0' : '#ddd',
                    borderRadius: 50,
                  }}
                  icon={<ArrowRightOutlined style={{ fontSize: 18 }} />}
                />
              </div>
            );
          }}
        />
      </ConfigProvider>
      <p
        style={{
          color: '#E01600',
          fontSize: 16,
          fontStyle: 'italic',
          fontWeight: 400,
          marginBottom: 0,
        }}
      >
        Quý khách vui lòng chọn ngày phù hợp
      </p>
    </Card>
  );

  // Hàm render ô ngày
  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = dayjs(value).format('YYYY-MM-DD');
    const special = specialDates[dateStr];
    const isHover = hoverDate === dateStr;

    const cellStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      textAlign: 'center',
      padding: 6,
      borderRadius: 6,
      cursor: special ? 'pointer' : 'default',
      border: special && isHover ? '1px solid red' : '1px solid transparent',
      transition: 'all 0.2s',
      background: 'transparent',
      font: 'inherit',
      color: 'inherit',
    };

    const hoverHandlers = {
      onMouseEnter: () => setHoverDate(dateStr),
      onMouseLeave: () => setHoverDate(null),
    };

    const cellContent = (
      <>
        {/* Ngày */}
        <div style={{ fontWeight: special ? 'bold' : '450', fontSize: 16 }}>
          {dayjs(value).date()}
        </div>

        {/* Giá */}
        <div
          style={{ fontSize: 14, fontWeight: '700', color: special ? '#E01600' : 'transparent' }}
        >
          {special?.price || '—'}
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
        onClick={() => {
          setSelectedDepartureId(special.id);
          onSelectDepartureId?.(special.id);
        }}
        aria-pressed={selectedDepartureId === special.id}
        aria-label={`Chọn ngày khởi hành ${dayjs(value).format('DD/MM/YYYY')}, giá ${special.price}`}
        style={cellStyle}
      >
        {cellContent}
      </button>
    );
  };

  const renderTravelInfoCard = () => {
    return (
      <Card
        styles={{ body: { paddingTop: 20 } }}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <button
              type="button"
              onClick={() => { setSelectedDepartureId(null); onSelectDepartureId?.(null); }}
              style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}
            >
              <ArrowLeft size={15} />
              <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Quay lại</Text>
            </button>
          </Col>
          <Col>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#E01600' }}>{dayjs(dataDetailTourDeparture?.departureDate).format('DD/MM/YYYY')}</div>
          </Col>
        </Row>

        <Divider
          style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 'bold', color: '#155790' }}
        >
          Phương tiện di chuyển
        </Divider>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 24, // tương tự gutter={24}
          }}
        >
          {/* Cột trái */}
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13 }}>
              Ngày đi - {dayjs(dataDetailTourDeparture?.departureDate).format('DD/MM/YYYY')}
            </Text>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: 500, fontSize: 13 }}>
                {clock(dataDetailTourDeparture?.departureDate)}
              </Text>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#d9d9d9',
                  margin: '0 8px',
                  position: 'relative',
                }}
              >
                <Bus
                  size={16}
                  color="#1677ff"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#fff', // che đường kẻ phía sau
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: 500, fontSize: 13 }}>{tourData?.departureCity.city}</Text>
              <Text style={{ fontWeight: 500, fontSize: 13 }}>
                {tourData?.destinationCity.city}
              </Text>
            </div>
          </div>

          {/* Divider dọc */}
          <Divider
            type="vertical"
            style={{
              height: 'auto',
              alignSelf: 'stretch',
              margin: 0,
            }}
          />

          {/* Cột phải */}
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13 }}>
              Ngày về - {dayjs(dataDetailTourDeparture?.returnDate).format('DD/MM/YYYY')}
            </Text>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: 500, fontSize: 13 }}>
                {clock(dataDetailTourDeparture?.returnDate)}
              </Text>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#d9d9d9',
                  margin: '0 8px',
                  position: 'relative',
                }}
              >
                <Bus
                  size={16}
                  color="#1677ff"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#fff', // che đường kẻ phía sau
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: 500, fontSize: 13 }}>
                {tourData?.destinationCity.city}
              </Text>
              <Text style={{ fontWeight: 500, fontSize: 13 }}>{tourData?.departureCity.city}</Text>
            </div>
          </div>
        </div>

        <Divider style={{ margin: '10px 0', fontSize: 15, fontWeight: 'bold', color: '#155790' }}>
          Giá Combo
        </Divider>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontWeight: 500, fontSize: 13 }}>Người lớn</Text>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 10 }}>
                  (Từ 12 tuổi trở lên)
                </Text>
              </div>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#E01600' }}>
                {vnd(dataDetailTourDeparture?.tourPrice?.adultPrice)}
              </Text>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontWeight: 500, fontSize: 13 }}>Trẻ em</Text>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 10 }}>
                  (Từ 5 đến 11 tuổi)
                </Text>
              </div>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#E01600' }}>
                {vnd(dataDetailTourDeparture?.tourPrice?.childPrice)}
              </Text>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontWeight: 500, fontSize: 13 }}>Trẻ nhỏ</Text>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 10 }}>
                  (Từ 2 - 4 tuổi)
                </Text>
              </div>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#E01600' }}>
                {vnd(dataDetailTourDeparture?.tourPrice?.toddlerPrice)}
              </Text>
            </div>
          </div>

          <Divider
            type="vertical"
            style={{
              height: 'auto',
              alignSelf: 'stretch',
              margin: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontWeight: 500, fontSize: 13 }}>Em bé</Text>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 10 }}>
                  (Dưới 2 tuổi)
                </Text>
              </div>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#E01600' }}>
                {vnd(dataDetailTourDeparture?.tourPrice?.infantPrice)}
              </Text>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <Text style={{ fontWeight: 500, fontSize: 13 }}>Phụ thu phòng đơn</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#E01600' }}>
                {vnd(dataDetailTourDeparture?.tourPrice?.singleSupplementPrice)}
              </Text>
            </div>
          </div>
        </div>

        <Divider style={{ margin: '10px 0', fontSize: 15, fontWeight: 'bold', color: '#155790' }}>
          Thông tin thêm
        </Divider>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>Địa điểm tập trung</div>
            <div style={{ display: 'flex' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Sẽ được thông báo trước ngày đi</div>
              <div style={{ fontWeight: 500, fontSize: 12, marginLeft: 3 }}>Đang cập nhật</div>
            </div>
          </div>

          <Divider
            type="vertical"
            style={{
              height: 'auto',
              alignSelf: 'stretch',
              margin: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>Địa điểm khách sạn</div>
            <div style={{ fontWeight: 500, fontSize: 11 }}>
              Chưa công bố. Vui lòng liên hệ SGU Tour để xác nhận trước chuyến đi.
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 24,
            backgroundColor: '#FDF3EB',
            color: '#EFAF76',
            fontWeight: 500,
            fontSize: 11,
            padding: 10,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          Giá được tính theo bảng giá và nhóm tuổi của từng hành khách; có thể đặt cho một người.
          Mỗi hành khách, kể cả trẻ nhỏ, chiếm một chỗ trong chuyến đi.
          Phụ thu phòng đơn chỉ là giá tham khảo và chưa tự động cộng vào thanh toán.
          Vui lòng đọc chính sách giữ chỗ, thanh toán và dời lịch SGU Tour bên dưới trước khi đặt.
        </div>
      </Card>
    );
  };

  return (
    <div>
      <Title
        level={4}
        style={{ textAlign: 'center', marginTop: 38, marginBottom: 18, fontWeight: 700 }}
      >
        LỊCH KHỞI HÀNH
      </Title>
      {loadingDepartures ? <Spin tip="Đang tải lịch khởi hành"><div style={{ minHeight: 120 }} /></Spin>
        : departureError ? <Alert type="error" showIcon message="Chưa tải được lịch khởi hành. Vui lòng thử lại." />
        : specialMonths.length === 0 ? <Empty description="Tour hiện chưa có lịch khởi hành sắp tới." />
        : <Row gutter={17}>
        <Col xs={24} md={4}>{renderMonthSelector()}</Col>
        <Col xs={24} md={20}>{selectedDepartureId ? (dataDetailTourDeparture ? renderTravelInfoCard() : <Spin />) : renderCalendar()}</Col>
      </Row>}
    </div>
  );
}

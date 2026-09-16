import { useEffect, useState } from 'react';
import {
  Calendar,
  Button,
  Row,
  Col,
  List,
  Card,
  ConfigProvider,
  Typography,
  Divider,
  Space,
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

dayjs.locale('vi');

const { Title, Text } = Typography;

interface ScheduleProps {
  // tourId?: number;
  // basePrice?: number;
  tourData?: ITour | null;
  onSelectDepartureId?: (id: number | null) => void;
}

export default function Schedule({ tourData, onSelectDepartureId }: ScheduleProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [currentDate, setCurrentDate] = useState(dayjs(''));
  const [specialDates, setSpecialDates] = useState<Record<string, { id: number; price: string }>>(
    {}
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [specialMonths, setSpecialMonths] = useState<string[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);
  const [dataDetailTourDeparture, setDataDetailTourDeparture] = useState<ITourDeparture | null>(
    null
  );

  const fechDataDepartureById = async () => {
    const res = await getDepartureByTourId(Number(tourData?.id));
    const data: TourDeparturesResponse = res;
    const newSpecialDates: Record<string, { id: number; price: string }> = {};
    const monthsWithDepartures = new Set<string>();

    data.result.forEach((dep: ITourDeparture) => {
      const date = dayjs(dep.departureDate);
      const dateKey = dayjs(dep.departureDate).format('YYYY-MM-DD');
      newSpecialDates[dateKey] = {
        id: Number(dep.id),
        price:
          tourData?.basePrice !== undefined
            ? `${(tourData.basePrice / 1000).toLocaleString('en-US')}K`
            : '',
      };

      monthsWithDepartures.add(date.format('YYYY-MM'));
    });
    const monthArray = Array.from(monthsWithDepartures);
    setSpecialDates(newSpecialDates);
    setSpecialMonths(monthArray);

    if (monthArray.length > 0 && !selectedMonth) {
      setSelectedMonth(monthArray[0]);
      const [m, y] = monthArray[0].split('/');
      setCurrentDate(dayjs(`${y}-${m}-01`));
    }
  };

  const fetchDataTourDepartureById = async () => {
    if (!selectedDepartureId) return;
    const res = await getTourDepartureById(selectedDepartureId);
    const data: TourDepartureResponse = res;
    setDataDetailTourDeparture(data.result);
  };

  useEffect(() => {
    fechDataDepartureById();
    fetchDataTourDepartureById();
  }, [tourData?.id, selectedDepartureId]);

  const handleMonthSelect = (month: string) => {
    setSelectedDepartureId(null);
    onSelectDepartureId?.(null);
    setSelectedMonth(month);
    const [m, y] = month.split('/');
    setCurrentDate(dayjs(`${y}-${m}-01`));
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
              {month}
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
  const dateCellRender = (value: any) => {
    const dateStr = dayjs(value).format('YYYY-MM-DD');
    const special = specialDates[dateStr];
    const isSpecial = Boolean(special);
    const isHover = hoverDate === dateStr;

    const handleClick = () => {
      if (special) {
        setSelectedDepartureId(special.id);
        onSelectDepartureId?.(special.id);
      }
    };

    return (
      <div
        onClick={handleClick}
        onMouseEnter={() => setHoverDate(dateStr)}
        onMouseLeave={() => setHoverDate(null)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          padding: 6,
          borderRadius: 6,
          cursor: 'pointer',
          border: isSpecial && isHover ? '1px solid red' : '1px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        {/* Ngày */}
        <div style={{ fontWeight: isSpecial ? 'bold' : '450', fontSize: 16 }}>
          {dayjs(value).date()}
        </div>

        {/* Giá */}
        <div
          style={{ fontSize: 14, fontWeight: '700', color: isSpecial ? '#E01600' : 'transparent' }}
        >
          {special?.price || '—'}
        </div>
      </div>
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
            <Space align="center" style={{ cursor: 'pointer', fontWeight: 500 }}>
              <ArrowLeft size={15} />
              <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Quay lại</Text>
            </Space>
          </Col>
          <Col>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#E01600' }}>25/10/2025</div>
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
              <Text style={{ fontWeight: 500, fontSize: 13 }}>20:00</Text>
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
              <Text style={{ fontWeight: 500, fontSize: 13 }}>22:00</Text>
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
              <Text style={{ fontWeight: 500, fontSize: 13 }}>20:00</Text>
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
              <Text style={{ fontWeight: 500, fontSize: 13 }}>22:00</Text>
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
                {dataDetailTourDeparture?.tourPrice.adultPrice.toLocaleString('vi-VN')} đ
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
                {dataDetailTourDeparture?.tourPrice.childPrice.toLocaleString('vi-VN')} đ
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
                {dataDetailTourDeparture?.tourPrice.toddlerPrice.toLocaleString('vi-VN')} đ
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
                {dataDetailTourDeparture?.tourPrice.infantPrice.toLocaleString('vi-VN')} đ
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
                {dataDetailTourDeparture?.tourPrice.singleSupplementPrice.toLocaleString('vi-VN')} đ
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
              <div style={{ fontWeight: 700, fontSize: 12 }}>10:00 19/10/2025</div>
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
              263 Lê Hồng Phong, Phường Thắng Tam, Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu, Việt Nam.
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
          Combo không hoàn, không hủy, không đổi. Giá áp dụng tối thiểu cho 2 khách/ booking. Quý
          khách cần mang theo CCCD/Passport gốc còn hạn để làm thủ tục nhận phòng. Giá chưa bao gồm
          chỗ ngồi cho trẻ em dưới 4 tuổi, nếu muốn mua thêm ghế ngồi trên xe vui lòng liên hệ phụ
          trách để được báo giá. Tổng đài tư vấn 1800.646.888.
          <br />
          Thông tin xe sẽ được cập nhật theo tình hình thực tế số lượng khách tham gia trong tour.
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
      <Row gutter={17}>
        <Col span={4}>{renderMonthSelector()}</Col>
        <Col span={20}>{selectedDepartureId ? renderTravelInfoCard() : renderCalendar()}</Col>
      </Row>
    </div>
  );
}

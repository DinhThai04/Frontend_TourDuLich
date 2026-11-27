import { Alert, Button, Card, Col, Divider, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Bus } from 'lucide-react';
import type { ITour, ITourDeparture } from '@/types/Tour';
import { formatCurrencyVND } from '@/utils';
import { isBookableDeparture, isDepartureSalesClosed } from '@/utils/tourSchedule';

const { Text } = Typography;

const clock = (value?: string | null): string =>
  value && dayjs(value).isValid() ? dayjs(value).format('HH:mm') : '—';

const vnd = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? formatCurrencyVND(value) : '—';

interface DepartureDetailsCardProps {
  departure: ITourDeparture;
  tourData: ITour;
  partySize: number;
  alternatives: ITourDeparture[];
  onSelectDepartureId: (id: number | null) => void;
}

export default function DepartureDetailsCard({
  departure, tourData, partySize, alternatives, onSelectDepartureId,
}: DepartureDetailsCardProps) {
  return (
    <Card
      styles={{ body: { paddingTop: 20 } }}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          <button
            type="button"
            onClick={() => onSelectDepartureId(null)}
            style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}
          >
            <ArrowLeft size={15} />
            <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Quay lại</Text>
          </button>
        </Col>
        <Col>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#155e54' }}>{dayjs(departure?.departureDate).format('DD/MM/YYYY')}</div>
        </Col>
      </Row>
      {(!isBookableDeparture(departure) || departure.availableSeats < partySize) && <Alert type="warning" showIcon
        message={isDepartureSalesClosed(departure) ? 'Lịch này đã đóng đặt chỗ' : departure.availableSeats > 0
          ? `Ngày này còn ${departure.availableSeats} chỗ cho nhóm ${partySize} người`
          : 'Ngày khởi hành này đã hết chỗ.'}
        description={alternatives.length ? <div className="flex flex-wrap gap-2">
          {alternatives.map(item => <Button key={item.id} onClick={() => onSelectDepartureId(item.id)}>
            {dayjs(item.departureDate).format('DD/MM/YYYY · HH:mm')}
          </Button>)}
        </div> : <a href="#tour-tuong-tu">Xem tour tương tự</a>} />}

      <Divider
        style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 'bold', color: '#155790' }}
      >
        Phương tiện di chuyển
      </Divider>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>
            Ngày đi - {dayjs(departure?.departureDate).format('DD/MM/YYYY')}
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
              {clock(departure?.departureDate)}
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
                  background: '#fff',
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

        <Divider
          type="vertical"
          style={{
            height: 'auto',
            alignSelf: 'stretch',
            margin: 0,
          }}
        />

        <div style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>
            Ngày về - {dayjs(departure?.returnDate).format('DD/MM/YYYY')}
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
              {clock(departure?.returnDate)}
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
                  background: '#fff',
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
        Bảng giá tour
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
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#155e54' }}>
              {vnd(departure?.tourPrice?.adultPrice)}
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
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#155e54' }}>
              {vnd(departure?.tourPrice?.childPrice)}
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
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#155e54' }}>
              {vnd(departure?.tourPrice?.toddlerPrice)}
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
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#155e54' }}>
              {vnd(departure?.tourPrice?.infantPrice)}
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
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#155e54' }}>
              {vnd(departure?.tourPrice?.singleSupplementPrice)}
            </Text>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '10px 0', fontSize: 15, fontWeight: 'bold', color: '#155790' }}>
        Thông tin thêm
      </Divider>

      <div className="mt-3 rounded-lg border border-slate-200 bg-[#F8FAFA] px-3 py-2.5 text-xs leading-relaxed text-[#374151]">
        <strong className="text-[#134E48]">Điểm tập trung & khách sạn:</strong> Sẽ được SGU Tour thông báo chi tiết trước ngày khởi hành 3 ngày.
      </div>
      <div
        style={{
          backgroundColor: '#FFF7ED',
          border: '1px solid #FDBA74',
          color: '#7C2D12',
          fontWeight: 500,
          fontSize: 12,
          lineHeight: 1.5,
          padding: '10px 12px',
          borderRadius: 10,
          marginTop: 10,
        }}
      >
        ⚠ Giá được tính theo bảng giá và nhóm tuổi của từng hành khách; có thể đặt cho một người.
        Mỗi hành khách, kể cả trẻ nhỏ, chiếm một chỗ trong chuyến đi.
        Phụ thu phòng đơn chỉ là giá tham khảo và chưa tự động cộng vào thanh toán.
      </div>
    </Card>
  );
}

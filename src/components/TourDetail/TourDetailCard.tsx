import { getTourDepartureById } from '@/services/tourServices';
import type { ITour, ITourDeparture } from '@/types/Tour';
import { formatCurrencyVND } from '@/utils';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TagOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Typography, Button, List } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
const { Text, Title } = Typography;

interface TourDetailCardProps {
  tourData?: ITour | null;
  selectedDepartureId?: number | null;
  onSelectDeparture?: () => void;
}

export default function TourDetailCard({
  selectedDepartureId,
  tourData,
  onSelectDeparture,
}: TourDetailCardProps) {
  const [dataDetailTourDeparture, setDataDetailTourDeparture] = useState<ITourDeparture | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const navi = useNavigate();
  useEffect(() => {
    let active = true;
    setDataDetailTourDeparture(null);
    setDetailLoading(Boolean(selectedDepartureId));
    if (selectedDepartureId) {
      getTourDepartureById(selectedDepartureId).then(response => {
        if (active) setDataDetailTourDeparture(response.result);
      }).catch(() => { if (active) setDataDetailTourDeparture(null); })
        .finally(() => { if (active) setDetailLoading(false); });
    }
    return () => { active = false; };
  }, [selectedDepartureId]);

  function accessBookingPage() {
    if (!selectedDepartureId || !tourData?.id) return;
    navi(`/booking?departureId=${selectedDepartureId}&tourId=${tourData.id}`);
  }
  const handleSelectDepartureClick = () => {
    if (onSelectDeparture) {
      onSelectDeparture();
    }
  };

  return (
    <Card
      style={{ width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      styles={{ body: { padding: 15 } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={{ fontWeight: 700 }}>Giá từ:</Text>
      </div>

      <Title
        level={3}
        style={{
          color: '#E01600',
          margin: '8px 0',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {tourData?.basePrice ? formatCurrencyVND(tourData.basePrice) : 'Đang cập nhật'}
        <span style={{ fontSize: 14, fontWeight: 500, color: '#555' }}>/ Khách</span>
      </Title>
      {/* 
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Tag
          color="#FFDBE1"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            width: "100%",
            color: "#E01600",
            fontSize: 10,
            fontWeight: 500,
            whiteSpace: "normal",
            padding: "4px 8px",
            margin: 0,        
          }}
        >
          <span style={{ fontSize: 15 }}>🎁</span>
          <span>Đặt ngay để nhận được ưu đãi giờ chót tiết kiệm thêm 500K</span>
        </Tag>
      </div> */}

      <List
        size="small"
        bordered={false}
        dataSource={[
          selectedDepartureId
            ? {
                label: 'Mã tour',
                value: dataDetailTourDeparture?.tourCode ?? '—',
                icon: <TagOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 13 },
              }
            : {
                label: 'Mã chương trình',
                value: tourData?.tourProgram,
                icon: <TagOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 15 },
                itemStyle: { color: '#000' },
              },
          selectedDepartureId
            ? {
                label: 'Khởi hành',
                value: tourData?.departureCity?.city ?? '—',
                icon: <EnvironmentOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 13 },
              }
            : null,
          selectedDepartureId
            ? {
                label: 'Ngày khởi hành',
                value: dataDetailTourDeparture?.departureDate
                  ? dayjs(dataDetailTourDeparture.departureDate).format('DD-MM-YYYY')
                  : '—',
                icon: <CalendarOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 13 },
              }
            : null,
          selectedDepartureId
            ? {
                label: 'Thời gian',
                value: tourData?.duration ? `${tourData.duration}N${tourData.duration - 1}Đ` : '',
                icon: <ClockCircleOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 13 },
              }
            : null,
          selectedDepartureId
            ? {
                label: 'Số chỗ còn',
                value: dataDetailTourDeparture?.availableSeats ?? '—',
                icon: <TeamOutlined />,
                valueStyle: { fontWeight: 500, fontSize: 13 },
              }
            : null,
        ].filter(Boolean)}
        style={{ padding: 0, margin: 0 }}
        renderItem={(item) => (
          <List.Item style={{ padding: '10px 0 0 0', border: 'none' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexWrap: 'wrap',
                wordBreak: 'break-word',
              }}
            >
              {item?.icon}
              <Text style={item?.valueStyle || {}}>{item?.label}:</Text>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: '#105A9C',
                  ...(item?.itemStyle || {}),
                }}
              >
                {item?.value}
              </Text>
            </span>
          </List.Item>
        )}
      />

      {selectedDepartureId ? (
        <div style={{ marginTop: 16, display: 'flex', gap: '8px' }}>
          {/* <Button
            style={{
              color: "#E01600",              
              border: "1px solid #E01600",           
              fontWeight: 500,
              fontSize: 12,
              width: "100%"
            }}
          >
           Ngày khác
          </Button> */}
          <Button
            icon={<CalendarOutlined />}
            disabled={detailLoading || !dataDetailTourDeparture}
            style={{
              backgroundColor: '#E01600',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
              fontSize: 12,
              width: '100%',
            }}
            onClick={accessBookingPage}
          >
            {detailLoading ? 'Đang tải lịch...' : dataDetailTourDeparture ? 'Đặt ngay' : 'Lịch không khả dụng'}
          </Button>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', gap: '8px' }}>
          <Button
            icon={<CalendarOutlined />}
            style={{
              backgroundColor: '#155790',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
              fontSize: 12,
              width: '100%',
            }}
            onClick={handleSelectDepartureClick}
          >
            Chọn ngày khởi hành
          </Button>
        </div>
      )}
    </Card>
  );
}

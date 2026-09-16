import React, { memo } from 'react';
import type { ITour } from '@/types/Tour';
import { formatCurrencyVND } from '@/utils';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import dayjs from 'dayjs';

const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/400x200?text=No+Image';

interface TourCardProps {
  tour: ITour;
  onBooking: (id: number) => void;
}

const TourCard: React.FC<TourCardProps> = ({ tour, onBooking }) => {
  const imageUrl =
    tour.imageIds && tour.imageIds.length > 0 ? tour.imageIds[0] : FALLBACK_IMAGE_URL;

  const nightDuration = tour.duration > 0 ? tour.duration - 1 : 0;

  return (
    <div className="!py-2 !px-[8px]">
      <div className="shadow-xl rounded-2xl overflow-hidden bg-white">
        <div className="relative">
          <img
            src={imageUrl}
            alt={tour.tourTitle || 'Tour image'}
            className="w-full h-[200px] object-cover"
          />
        </div>

        <div className="!p-[16px]">
          <h3 className="text-[18px] font-[600] !mb-0 h-[54px] overflow-hidden">
            {tour.tourTitle}
          </h3>
          <p className="!px-0 !py-[4px] truncate">
            <NumberOutlined /> <b>ID:</b> {tour.id}
          </p>
          <p className="!px-0 !py-[4px] truncate">
            <EnvironmentOutlined /> <b>Khởi hành từ:</b> {tour.departureCity.city}
          </p>
          <p className="!px-0 !py-[4px] truncate">
            <CalendarOutlined /> <b>Ngày khởi hành: </b>
            <span className="text-gray-600 ml-1">
              {tour.departures && tour.departures.length > 0
                ? tour.departures
                    .map((item) => dayjs(item.departureDate).format('DD/MM/YYYY'))
                    .join(', ')
                : 'Đang cập nhật'}
            </span>
          </p>
          <p className="!px-0 !py-[4px] truncate">
            <FieldTimeOutlined /> <b>Thời gian:</b> {tour.duration} ngày {nightDuration} đêm
          </p>

          <div className="!mt-[12px] flex justify-between items-center">
            <span className="text-[18px] font-bold text-[#FFDA32]">
              {formatCurrencyVND(tour.basePrice)}
            </span>
            <Button
              type="primary"
              className="!bg-[#7BBCB0] !font-bold"
              onClick={() => onBooking(tour.id)}
            >
              Đặt ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TourCard);

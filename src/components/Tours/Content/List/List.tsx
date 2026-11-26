import { Button } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  CarOutlined,
  SendOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ITour } from '@/types/Tour';
import { formatCurrencyVND } from '@/utils';
import { useNavigate } from 'react-router-dom';
import FALLBACK_IMAGE_URL from '@/assets/images/fallback.png';
import dayjs from 'dayjs';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import { formatVehicleLabel } from '@/utils/tourSearch';

export interface TourRatingInfo {
  avg: number;
  count: number;
}

type TourListProps = {
  tours: ITour[];
  ratingsMap?: Record<number, TourRatingInfo>;
};

const List = ({ tours, ratingsMap = {} }: TourListProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      {tours.map((tour) => {
        const nights = tour.duration > 0 ? tour.duration - 1 : 0;
        const durationText = nights > 0 ? `${tour.duration} ngày ${nights} đêm` : `${tour.duration} ngày`;
        const departures = tour.departures ?? [];
        const nearest = departures[0] as
          | (typeof departures[number] & { remainingSeats?: number; availableSeats?: number; available?: number })
          | undefined;
        const remainingSeats = nearest?.remainingSeats ?? nearest?.availableSeats ?? nearest?.available;
        const rating = ratingsMap[tour.id];
        const visibleChips = departures.slice(0, 3);
        const extraChips = Math.max(0, departures.length - 3);
        const isFlight = (tour.vehicle?.name || '').toLowerCase().includes('máy bay');

        return (
          <article
            key={tour.id}
            onClick={() => navigate(`/tours/detail/${tour.id}`)}
            className="group bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col md:flex-row gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-[#A7D7CF] hover:shadow-[0_12px_28px_rgba(19,78,72,0.10)]"
          >
            {/* Left Image: 280x200 */}
            <div className="w-full md:w-[280px] h-[200px] shrink-0 rounded-xl overflow-hidden bg-[#F3F8F6]">
              <ResponsiveImage
                alt={tour.tourTitle}
                src={(tour?.imageIds && tour.imageIds[0]) || FALLBACK_IMAGE_URL}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                width={560}
                height={400}
              />
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
              <div>
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {nearest?.departureDate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F4F1] text-[#134E48] text-[12px] font-medium px-2.5 py-0.5">
                      <CalendarOutlined className="text-[11px]" />
                      Khởi hành {dayjs(nearest.departureDate).format('DD/MM/YYYY')}
                    </span>
                  )}
                  {typeof remainingSeats === 'number' && remainingSeats > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[#FFEDE5] text-[#C2410C] text-[12px] font-semibold px-2.5 py-0.5">
                      Còn {remainingSeats} chỗ
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2
                  title={tour.tourTitle}
                  className="m-0 mb-2 text-[18px] leading-[25px] font-semibold text-[#1F2937] line-clamp-2 group-hover:text-[#134E48] transition-colors"
                >
                  {tour.tourTitle}
                </h2>

                {/* Single meta line with icons separated by dots */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6B7280] mb-2">
                  <span className="inline-flex items-center gap-1 text-[#1F2937]">
                    <EnvironmentOutlined className="text-[#1F7A6E]" />
                    {tour.departureCity?.city}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <ClockCircleOutlined className="text-[#1F7A6E]" />
                    {durationText}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    {isFlight ? <SendOutlined className="text-[#1F7A6E]" /> : <CarOutlined className="text-[#1F7A6E]" />}
                    {formatVehicleLabel(tour.vehicle?.name)}
                  </span>
                </div>

                {/* Rating row if available */}
                {rating && rating.count > 0 && (
                  <div className="flex items-center gap-1.5 text-[13px] mb-2">
                    <span className="text-[#F59E0B] text-[14px]" aria-hidden="true">★</span>
                    <span className="font-semibold text-[#1F2937]">{rating.avg.toFixed(1).replace('.', ',')}</span>
                    <span className="text-[#6B7280]">({rating.count} đánh giá)</span>
                  </div>
                )}
              </div>

              {/* Departure date chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {visibleChips.length > 0 ? (
                  <>
                    {visibleChips.map((dep) => (
                      <span
                        key={dep.id ?? dep.departureDate}
                        className="inline-flex items-center rounded-md border border-[#E5E7EB] bg-[#F8FAFA] text-[#1F2937] text-[12px] font-medium px-2 py-0.5"
                      >
                        {dayjs(dep.departureDate).format('DD/MM')}
                      </span>
                    ))}
                    {extraChips > 0 && (
                      <span className="inline-flex items-center rounded-md bg-[#E6F4F1] text-[#134E48] text-[12px] font-semibold px-2 py-0.5">
                        +{extraChips}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[12px] text-[#6B7280]">Lịch khởi hành đang cập nhật</span>
                )}
              </div>
            </div>

            {/* Right Price Column (~180px with vertical divider) */}
            <div
              className="md:w-[184px] shrink-0 md:border-l md:border-[#E5E7EB] md:pl-5 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E7EB] flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-left md:text-right">
                <span className="block text-[12px] text-[#6B7280] leading-4">Giá từ</span>
                <span className="block text-[22px] md:text-[24px] font-bold text-[#134E48] leading-tight mt-0.5 tabular-nums">
                  {formatCurrencyVND(tour.basePrice)}
                </span>
                <span className="block text-[12px] text-[#6B7280] leading-4 mt-0.5">/khách</span>
              </div>
              <Button
                type="primary"
                href={`/tours/detail/${tour.id}`}
                className="md:w-full !h-[40px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258] !font-semibold !text-[14px]"
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  navigate(`/tours/detail/${tour.id}`);
                }}
              >
                Xem chi tiết
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default List;

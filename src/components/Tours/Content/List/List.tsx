import { Card, Button, Space, Typography } from 'antd';
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
const { Text } = Typography;

type TourListProps = {
  tours: ITour[];
  comparedIds: number[];
  comparisonFull: boolean;
  onCompare: (tour: ITour) => void;
};

const List = ({ tours, comparedIds, comparisonFull, onCompare }: TourListProps) => {
  const navigate = useNavigate();
  return (
    <div className="!p-4">
      <div className="flex flex-col gap-5">
        {tours.map(tour => {
          const compared = comparedIds.includes(Number(tour.id));
          return (
            <Card
              onClick={() => {
                navigate(`/tours/detail/${tour.id}`);
              }}
              key={tour.id}
              className="journey-tour-card rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3 flex-shrink-0 rounded-lg overflow-hidden">
                  <ResponsiveImage
                    alt={tour.tourTitle}
                    src={(tour?.imageIds && tour.imageIds[0]) || FALLBACK_IMAGE_URL}
                    className="w-full h-[220px] sm:h-full object-cover"
                    width={640} height={400}
                  />
                </div>
                <div className="flex-1 flex flex-col h-full">
                  <div className="!mb-6">
                    <span className="font-[700] text-[20px]">{tour.tourTitle}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <span>
                      <span className="!mr-2">
                        <EnvironmentOutlined className="!mr-1" />
                        Khởi hành:
                      </span>
                      <span className="font-[700]">{tour.departureCity.city}</span>
                    </span>
                    <Space size="middle" wrap className=" mb-4">
                      <span>
                        <span className="!mr-2">
                          <ClockCircleOutlined className="!mr-1" />
                          Thời gian:
                        </span>

                        <span className="font-[700]">
                          {tour.duration}N{tour.duration - 1}Đ
                        </span>
                      </span>
                      <Text>
                        <span>
                          <span className="!mr-2">
                            {tour.vehicle.name === 'Máy bay' ? (
                              <SendOutlined className="!mr-1" />
                            ) : (
                              <CarOutlined className="!mr-1" />
                            )}
                            Phương tiện:
                          </span>

                          <span className="font-[700]"> {tour.vehicle.name}</span>
                        </span>
                      </Text>
                    </Space>
                    <span>
                      <p className="!px-0 !py-[4px] truncate">
                        <CalendarOutlined className="!mr-1" />
                        <span className="!mr-2">Ngày khởi hành:</span>
                        <span className=" font-bold ml-1">
                          {tour.departures && tour.departures.length > 0
                            ? tour.departures
                                .map((item) => dayjs(item.departureDate).format('DD/MM/YYYY'))
                                .join(', ')
                            : 'Đang cập nhật'}
                        </span>
                      </p>
                    </span>
                  </div>
                  <div className="!mt-4 flex flex-wrap justify-between items-center gap-2">
                    <div className="">
                      <Text className="text-gray-500 font-bold !text-[18px]">Giá chỉ từ</Text>
                      <span className="block text-[#155e54] !mt-0 font-[700] text-[24px]">
                        {formatCurrencyVND(tour.basePrice)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2" onClick={event => event.stopPropagation()}>
                      <Button aria-pressed={compared} aria-label={`So sánh ${tour.tourTitle}`}
                        disabled={comparisonFull && !compared} type={compared ? 'dashed' : 'default'}
                        onClick={() => onCompare(tour)}>
                        {compared ? 'Đã chọn' : 'So sánh'}
                      </Button>
                      <Button href={`/tours/detail/${tour.id}`} type="primary" className="!bg-[#21776D]"
                        onClick={event => {
                          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                          event.preventDefault();
                          navigate(`/tours/detail/${tour.id}`);
                        }}>
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default List;

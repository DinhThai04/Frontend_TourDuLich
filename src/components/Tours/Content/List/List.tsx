import { Card, Button, Space, Typography, Empty } from 'antd';
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
const { Text } = Typography;

const List = ({ tours }: { tours: ITour[] | null }) => {
  const navigate = useNavigate();
  console.log(tours);
  return (
    <div className="!p-4">
      {/* <Title level={2} className="text-center mb-8">
        Danh sách Tour nổi bật
      </Title> */}
      <div className="flex flex-col gap-5 min-h-[600px] max-h-[600px] overflow-y-auto !pr-4">
        {tours && tours.length > 0 ? (
          tours.map((tour) => (
            <Card
              onClick={() => {
                navigate(`/tours/detail/${tour.id}`);
              }}
              key={tour.id}
              className="rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
            >
              <div className="flex flex-row gap-4">
                <div className="w-1/3 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    alt={tour.tourTitle}
                    src={(tour?.imageIds && tour.imageIds[0]) || FALLBACK_IMAGE_URL}
                    className="w-full h-full object-cover"
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
                    <Space size="middle" className=" mb-4">
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
                  <div className="!mt-4 flex justify-between items-center">
                    <div className="">
                      <Text className="text-gray-500 font-bold !text-[18px]">Giá chỉ từ</Text>
                      <span className="block text-[#FFDA32] !mt-0 font-[700] text-[24px]">
                        {formatCurrencyVND(tour.basePrice)}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        navigate(`/tours/detail/${tour.id}`);
                      }}
                      type="primary"
                      className="mt-2 !bg-[#7BBCB0]"
                      size="large"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <Empty description="Không có x`i phù hợp" />
          </div>
        )}
      </div>
    </div>
  );
};

export default List;

import Container from '@/components/Share/Container';
import { getRandom7Destinations } from '@/services/tourServices';
import type { ILocation } from '@/types/Tour';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider, { type Settings } from '@/components/Share/TourSlider';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import { errorMessage } from '@/utils/errors';
import { message } from 'antd';

const VouchersSlider: React.FC = () => {
  const settings: Settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  const [destinations, setDestination] = useState<ILocation[]>();

  const get7Destinations = async () => {
    try {
      const res = await getRandom7Destinations();
      if (res.code === 1000) setDestination(res.result);
      // Báo lỗi có cấu trúc (code !== 1000) cũng phải hiện, nếu không slider vĩnh viễn trống mà không ai biết.
      else message.error(res.message || 'Không tải được điểm đến nổi bật.');
    } catch (error) {
      message.error(errorMessage(error, 'Không tải được điểm đến nổi bật.'));
    }
  };
  const destinationPath = (city: string) => {
    const params = new URLSearchParams();
    params.set('dest', city);
    return `/tours/search?${params.toString()}`;
  };

  useEffect(() => {
    get7Destinations();
  }, []);
  return (
    <div className="py-10  !mb-20">
      <Container>
        {/* Title */}
        <div className="!mb-3">
          <h2 className="text-[32px] font-bold text-[#7BBCB0] mb-2 uppercase">ĐỊA ĐIỂM HẤP DẪN</h2>
          <div className="w-[60px] h-1 bg-[#FFDA32] rounded"></div>
        </div>

        {/* Description */}
        <p className="text-[18px] leading-relaxed text-[#778088] mb-6 max-w-[720px]">
          Khám phá các chuyến đi độc quyền của chúng tôi với mức giá vô cùng hợp lý.
        </p>

        <Slider {...settings} className="w-full">
          {destinations &&
            destinations.length > 0 &&
            destinations.map((dest, index) => (
              <Link
                key={dest.city || index}
                to={destinationPath(dest.city)}
                aria-label={`Xem tour đến ${dest.city}`}
                className="!px-[10px] cursor-pointer"
              >
                <div className="relative w-full h-[240px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <ResponsiveImage
                    src={dest.img}
                    alt={`Ảnh điểm đến ${dest.city}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    width={640} height={400}
                  />
                  <div className="absolute bottom-0 left-0 w-full text-center text-white text-[18px] font-semibold uppercase !p-3 bg-gradient-to-t from-[rgba(0,0,0,0.85)] to-transparent">
                    {dest.city}
                  </div>
                </div>
              </Link>
            ))}
        </Slider>
      </Container>
    </div>
  );
};

export default VouchersSlider;

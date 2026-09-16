import Container from '@/components/Share/Container';
import { getRandom7Destinations } from '@/services/tourServices';
import type { ILocation } from '@/types/Tour';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider, { type Settings } from 'react-slick';

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
    const res = await getRandom7Destinations();

    if (res.code === 1000) {
      setDestination(res.result);
    }
  };
  const navigate = useNavigate();
  const handleView = (city: string) => {
    const params = new URLSearchParams();
    params.set('dest', city);

    navigate(`/tours/search?${params.toString()}`);
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
              <div
                key={index}
                className="!px-[10px] cursor-pointer"
                onClick={() => handleView(dest.city)}
              >
                <div className="relative w-full h-[240px] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <img
                    src={dest.img}
                    alt={`Voucher ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 w-full text-center text-white text-[18px] font-semibold uppercase !p-3 bg-gradient-to-t from-[rgba(0,0,0,0.85)] to-transparent">
                    {dest.city}
                  </div>
                </div>
              </div>
            ))}
        </Slider>
      </Container>
    </div>
  );
};

export default VouchersSlider;

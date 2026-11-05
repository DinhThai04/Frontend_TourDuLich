import Slider, { type Settings } from '@/components/Share/TourSlider';
import vou1 from '@/assets/images/sl1-optimized.webp';
import vou2 from '@/assets/images/sl2-optimized.webp';
import vou3 from '@/assets/images/sl3-optimized.webp';
import vou4 from '@/assets/images/sl4-optimized.webp';

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
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const tours: string[] = [vou1, vou2, vou3, vou4];

  return (
    <div className="py-10">
      <Slider {...settings}>
        {tours.map((img, index) => (
          <div key={index} className="!pe-[10px]">
            <img
              src={img}
              alt={`Vou ${index + 1}`}
              className="w-[100%] h-[240px] rounded-xl object-cover"
              loading="lazy" decoding="async" width={960} height={640}
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default VouchersSlider;

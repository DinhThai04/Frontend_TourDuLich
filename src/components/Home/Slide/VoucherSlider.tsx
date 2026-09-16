import Slider, { type Settings } from 'react-slick';
import vou1 from '@/assets/images/sl1.jpg';
import vou2 from '@/assets/images/sl2.jpg';
import vou3 from '@/assets/images/sl3.jpg';
import vou4 from '@/assets/images/sl4.jpg';

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
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default VouchersSlider;

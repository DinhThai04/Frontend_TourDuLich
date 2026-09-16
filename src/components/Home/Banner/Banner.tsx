import banner from '@/assets/images/banner.jpg';
import Tours from './Tours';
import Container from '@/components/Share/Container';

const Banner = () => {
  return (
    <div className="!mb-[180px] ">
      <div className="h-[500px] w-full">
        <img src={banner} alt="" className="h-full w-full object-cover" />
      </div>
      <Container className="relative">
        <div className="absolute w-full left-[50%] top-[100%] -translate-x-[50%] -translate-y-[30%] drop-shadow-xl">
          <div className="bg-white !rounded-[10px] !py-[20px] !px-[18px] ">
            <Tours />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Banner;

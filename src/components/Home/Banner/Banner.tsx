import bannerSmall from '@/assets/images/banner-768.webp';
import banner from '@/assets/images/banner-1600.webp';
import bannerLarge from '@/assets/images/banner-2340.webp';
import Tours from './Tours';
import Container from '@/components/Share/Container';

const Banner = () => {
  return (
    <div className="!mb-20">
      <div className="h-[280px] md:h-[500px] w-full">
        <img src={banner} srcSet={`${bannerSmall} 768w, ${banner} 1600w, ${bannerLarge} 2340w`}
          sizes="100vw" width={1600} height={1067} loading="eager" fetchPriority="high" decoding="async"
          alt="" className="h-full w-full object-cover" />
      </div>
      <Container className="relative !px-4">
        <div className="relative z-10 -mt-12 md:-mt-24 w-full drop-shadow-xl">
          <div className="bg-white !rounded-[10px] !py-[20px] !px-[18px] ">
            <Tours />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Banner;

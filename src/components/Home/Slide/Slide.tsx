import Container from '@/components/Share/Container';
import VouchersSlider from './VoucherSlider';

const Slide = () => {
  return (
    <div>
      <Container>
        <div className="!mb-[40px] flex flex-col items-center ">
          <h2 className="text-[36px] text-center font-bold text-[#7BBCB0] mb-2 uppercase">
            CHÀO MỪNG ĐẾN VỚI SGU TOUR
          </h2>
          {/* <div className="w-[40%] h-1 bg-[#FFDA32] rounded"></div> */}
        </div>
        <div className="slider" style={{ marginBottom: 100 }}>
          <VouchersSlider />
        </div>
      </Container>
    </div>
  );
};

export default Slide;

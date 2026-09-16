import Container from '@/components/Share/Container';
import { Card } from 'antd';

const highlights = [
  {
    title: 'Giá tốt - nhiều ưu đãi',
    desc: 'Ưu đãi và quà tặng hấp dẫn khi mua tour online',
    icon: '💰',
  },
  {
    title: 'Thanh toán an toàn',
    desc: 'Được bảo mật bởi tổ chức quốc tế Global Sign',
    icon: '🔒',
  },
  {
    title: 'Hành trình cá nhân hóa',
    desc: 'Thiết kế lịch trình phù hợp với nhu cầu và sở thích riêng của bạn',
    icon: '🗺️',
  },
  {
    title: 'Thương hiệu uy tín',
    desc: 'Thương hiệu lữ hành hàng đầu Việt Nam',
    icon: '🏆',
  },
];

export default function HighlightsSection() {
  return (
    <div className="py-16  !mb-20">
      <Container>
        <h2 className="text-3xl md:text-4xl text-center font-poppins font-bold text-[#7BBCB0] !mb-10 uppercase">
          Vì sao nên chọn SGU TOUR
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((item, index) => (
            <Card
              key={index}
              hoverable
              className="flex flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-5xl !mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-[#7BBCB0] font-poppins mb-2">
                {item.title}
              </h3>
              <p className="text-[#778088] font-inter">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}

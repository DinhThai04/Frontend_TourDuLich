import {
  FacebookFilled,
  TwitterSquareFilled,
  InstagramFilled,
  YoutubeFilled,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  RightOutlined, // Thêm icon mũi tên nhỏ cho đẹp
} from '@ant-design/icons';
import Container from '@/components/Share/Container';
import momo from '@/assets/images/momo.png';
import certificate from '@/assets/images/certificate.webp';

export const Footer = () => {
  // Danh sách liên kết (Tách ra để code gọn hơn)
  const quickLinks = [
    { title: 'Về chúng tôi', url: '#' },
    { title: 'Điểm đến nổi bật', url: '#' },
    { title: 'Danh sách Tour', url: '#' },
    { title: 'Cẩm nang du lịch', url: '#' },
    { title: 'Chính sách bảo mật', url: '#' },
  ];

  return (
    <div className="bg-slate-900 text-slate-300 !pt-16 !pb-8 text-sm">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* 1. Logo & Giới thiệu */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-wide">
              SGU<span className="text-[#7BBCB0]">Tour</span>
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Khám phá Việt Nam và hơn thế nữa với các chuyến tham quan được tuyển chọn cẩn thận,
              các ưu đãi phút chót và những trải nghiệm khó quên.
            </p>
            {/* Social Media di chuyển về đây để đi kèm thương hiệu */}
            <div className="flex gap-4 mt-4">
              {[
                { icon: <FacebookFilled />, color: 'hover:text-blue-500' },
                { icon: <TwitterSquareFilled />, color: 'hover:text-sky-400' },
                { icon: <InstagramFilled />, color: 'hover:text-pink-500' },
                { icon: <YoutubeFilled />, color: 'hover:text-red-500' },
              ].map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`text-2xl transition-colors duration-300 ${item.color}`}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2. Liên kết nhanh (Đã khôi phục và làm đẹp) */}
          <div>
            <h4 className="text-white font-semibold text-lg !mb-6 border-b border-slate-700 !pb-2 inline-block">
              Liên kết nhanh
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="group flex items-center hover:text-[#7BBCB0] transition-all duration-300"
                  >
                    <RightOutlined className="!mr-2 text-xs opacity-0 !-ml-4 group-hover:opacity-100 group-hover:ml-0! transition-all duration-300" />
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Thông tin liên hệ */}
          <div>
            <h4 className="text-white font-semibold text-lg !mb-6 border-b border-slate-700 pb-2! inline-block">
              Liên hệ
            </h4>
            <div className="space-y-4!">
              <p className="flex items-start gap-3!">
                <EnvironmentOutlined className="text-[#7BBCB0] mt-1!" />
                <span>
                  123 Nguyễn Huệ, Quận 1,
                  <br />
                  TP. Hồ Chí Minh, Việt Nam
                </span>
              </p>
              <p className="flex items-center gap-3!">
                <PhoneOutlined className="text-[#7BBCB0]" />
                <span className="font-medium text-white hover:text-[#7BBCB0] cursor-pointer">
                  +84 123 456 789
                </span>
              </p>
              <p className="flex items-center gap-3!">
                <MailOutlined className="text-[#7BBCB0]" />
                <span className="hover:text-[#7BBCB0] cursor-pointer">support@travelvn.com</span>
              </p>
            </div>
          </div>

          {/* 4. Thanh toán & Chứng nhận */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6! border-b  border-slate-700 pb-2! inline-block">
              Thanh toán & Chứng nhận
            </h4>

            <p className="mb-3! text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Chấp nhận thanh toán
            </p>
            <div className="flex flex-wrap gap-3! mb-8!">
              {/* Container màu trắng mờ để logo nổi bật trên nền tối */}
              <div className="bg-white/10 p-2! rounded-md hover:bg-white/20 transition">
                <CreditCardOutlined style={{ fontSize: 24, color: '#fff' }} title="Thẻ quốc tế" />
              </div>
              <div className="bg-white p-1! rounded-md h-10 w-10 flex items-center justify-center">
                <img src={momo} alt="Momo" className="h-full object-contain" />
              </div>
              <div className="bg-white p-1! rounded-md h-10 w-10 flex items-center justify-center">
                {/* Giả sử bạn có hình zalo */}
                <span className="text-blue-600 font-bold text-xs">Zalo</span>
                {/* <img src="/icons/zalopay.png" alt="ZaloPay" className="h-full object-contain" /> */}
              </div>
            </div>

            <p className="mb-3! text-slate-400 text-xs uppercase tracking-wider font-bold">
              Đối tác tin cậy
            </p>
            <div>
              <img
                src={certificate}
                alt="Certificate"
                className="w-32 opacity-90 hover:opacity-100 transition duration-300"
              />
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-slate-800 mt-12! pt-8! text-center text-slate-500 text-sm">
          <p>
            PhathociT Design ©{new Date().getFullYear()} Created by Ant UED. All rights reserved.
          </p>
        </div>
      </Container>
    </div>
  );
};

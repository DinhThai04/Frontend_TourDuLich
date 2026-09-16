import Container from '@/components/Share/Container';
import { getHighReviews } from '@/services/authServices';
import type { ReviewResponse } from '@/types/Auth';
import { Empty } from 'antd';
import { useEffect, useState } from 'react';

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        // Nếu i <= rating (ví dụ 4 sao), thì tô màu vàng, ngược lại tô màu xám
        className={i <= rating ? 'text-[#FFDA32]' : 'text-gray-300'}
      >
        ★
      </span>
    );
  }
  return <div className="flex">{stars}</div>;
};

const Rating = () => {
  const [reviews, setReviews] = useState<ReviewResponse[]>();
  useEffect(() => {
    const getHighRating = async (size: number = 3) => {
      const res = await getHighReviews(size);
      if (res.code === 1000) {
        setReviews(res.result);
      }
    };

    getHighRating();
  }, []);

  return (
    <div className="!mb-40">
      <Container>
        <div>
          <div className="!mb-3">
            <h2 className="text-[32px] font-bold text-[#7BBCB0] mb-2 uppercase">
              ĐÁNH GIÁ CHUYẾN ĐI
            </h2>
            <div className="w-[60px] h-1 bg-[#FFDA32] rounded"></div>
          </div>

          {/* Description */}
          <p className="text-[18px] leading-relaxed text-[#778088] mb-6 max-w-[720px]">
            Hãy xem khách hàng của chúng tôi nói gì về những trải nghiệm tuyệt vời của họ!
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* --- LẶP VÀ RENDER THẺ --- */}
          {/* 4. Lặp qua dữ liệu MỚI */}
          {(reviews &&
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white !p-6 rounded-lg shadow-lg transition-transform duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center !mb-4">
                  <img
                    src={review.user.avatar}
                    alt={`Ảnh đại diện của ${review.user.username}`}
                    className="w-16 h-16 rounded-full !mr-4 object-cover !border-2 !border-[#FFDA32]"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{review.user.username}</h4>
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-[#778088] italic">"{review.content}"</p>
                <p className="text-right text-sm text-[#7BBCB0] mt-4 pt-4 border-t border-gray-100">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))) || (
            <>
              <div></div>
              <div className="">
                <Empty description="No rating found at this moment." />
              </div>
              <div></div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Rating;

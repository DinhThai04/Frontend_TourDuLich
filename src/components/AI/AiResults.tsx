import { useState } from 'react';
import { Link } from 'react-router-dom';
import { safeAiImage } from '../../services/aiServices';
import type { AiResult } from '../../types/ai';
import { formatDatetime } from '@/utils';
import fallback from '../../assets/branding/sgu-tour-icon.svg';

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
// Backend gửi LocalDateTime không kèm múi giờ; formatDatetime mới gắn đúng +07:00,
// còn new Date(chuỗi naive) sẽ bị trình duyệt hiểu theo giờ máy khách.
function TourImage({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? fallback : safeAiImage(url) || fallback}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
const tourLink = (id: number) => `/tours/detail/${id}`;

export default function AiResults({
  result,
  onSuggest,
  disabled,
}: {
  result: AiResult;
  onSuggest: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      {result.tours.length > 0 && (
        <div className="ai-tour-list">
          {result.tours.map((tour, index) => (
            <article className="ai-tour-card" key={tour.tourId}>
              <TourImage url={tour.imageUrl} title={tour.title} />
              <div>
                <strong>
                  {index + 1}. {tour.title}
                </strong>
                <div>
                  {tour.destinationName} · {tour.durationDays} ngày
                </div>
                <div className="ai-tour-price">
                  {money(tour.price.amountVnd)}{' '}
                  {tour.price.basis === 'TOTAL_GROUP' ? '/ nhóm đã cung cấp' : '/ người lớn'}
                </div>
                {tour.availability.status === 'AVAILABLE' && tour.availability.departureAt ? (
                  <div>
                    Khởi hành: {formatDatetime(tour.availability.departureAt)} · còn{' '}
                    {tour.availability.availableSeats} chỗ khi kiểm tra
                  </div>
                ) : (
                  <div>Chưa xác nhận được lịch còn chỗ phù hợp.</div>
                )}
                <small>Giá tham khảo · kiểm tra {formatDatetime(tour.price.checkedAt)}</small>
                <Link to={tourLink(tour.tourId)}>Xem tour</Link>
              </div>
            </article>
          ))}
          <small>
            Giá và chỗ được kiểm tra lại khi đặt tour. Số thứ tự khi hỏi tiếp dựa trên danh sách tìm
            mới nhất.
          </small>
        </div>
      )}
      {result.searchSummary?.hasMore && (
        <button
          className="ai-suggestion"
          disabled={disabled}
          onClick={() => onSuggest('Cho tôi xem thêm các tour phù hợp với điều kiện hiện tại.')}
        >
          Xem thêm tour
        </button>
      )}
      {!!result.clarification?.suggestedReplies.length && (
        <div className="ai-suggestions">
          {result.clarification.suggestedReplies.map((text) => (
            <button
              key={text}
              className="ai-suggestion"
              disabled={disabled}
              onClick={() => onSuggest(text)}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      {result.detail && (
        <section className="ai-detail" aria-label="Lịch trình tour">
          <strong>{result.detail.title}</strong>
          {result.detail.itinerary.map((day) => (
            <details key={day.dayNumber}>
              <summary>
                Ngày {day.dayNumber}: {day.title}
              </summary>
              <p>{day.description}</p>
              {day.meal && <p>Bữa ăn: {day.meal}</p>}
            </details>
          ))}
          {result.detail.truncated && <p>Nội dung đã rút gọn; xem đầy đủ tại trang tour.</p>}
          <small>Dữ liệu kiểm tra: {formatDatetime(result.detail.dataAsOf)}</small>
          <Link to={tourLink(result.detail.tourId)}>Mở trang chi tiết tour</Link>
        </section>
      )}
      {result.comparison && (
        <section aria-label="So sánh tour">
          <div className="ai-comparison-scroll" tabIndex={0}>
            <table className="ai-comparison">
              <caption>So sánh giá người lớn tham khảo</caption>
              <thead>
                <tr>
                  <th>Tour</th>
                  <th>Điểm đến / thời gian</th>
                  <th>Giá người lớn</th>
                  <th>Lịch tương lai</th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.items.map((item) => (
                  <tr key={item.tourId}>
                    <td>
                      <Link to={tourLink(item.tourId)}>{item.title}</Link>
                    </td>
                    <td>
                      {item.destinationName}
                      <br />
                      {item.durationDays} ngày
                    </td>
                    <td>{money(item.referenceAdultPriceVnd)}</td>
                    <td>{item.hasFutureDeparture ? 'Có, cần kiểm tra chỗ' : 'Chưa có'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small>
            Kiểm tra: {formatDatetime(result.comparison.dataAsOf)}. Đây không phải tổng tiền cho nhóm.
          </small>
        </section>
      )}
      {result.policy && (
        <small className="ai-policy-source">
          Nguồn: {result.policy.sourceLabel} · {result.policy.policyVersion}
          {' · '}
          <Link to={`/policies#${result.policy.policyKey}`}>Xem chính sách</Link>
        </small>
      )}
    </>
  );
}

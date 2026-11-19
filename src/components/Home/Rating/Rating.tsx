import { useHomeMotion } from '../homeMotionContext';
import Container from '@/components/Share/Container';
import ResponsiveImage from '@/components/Share/ResponsiveImage';
import { getHighReviews } from '@/services/authServices';
import { getTourById } from '@/services/tourServices';
import type { ReviewResponse } from '@/types/comment';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { formatDate } from '@/utils';
import { Link } from 'react-router-dom';
type NamedReview = ReviewResponse & { tourTitle?: string };
function ReviewRow({ reviews, offset }: { reviews: NamedReview[]; offset: boolean }) {
  const group = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);
  useEffect(() => {
    if (!group.current) return;
    const observer = new ResizeObserver(() => {
      if (group.current) setDuration(Math.max(20, group.current.getBoundingClientRect().width / 28));
    });
    observer.observe(group.current);
    return () => observer.disconnect();
  }, []);
  const cards = reviews.map(review => <article className="home-review-card" key={review.id}>
    <div className="home-review-author">
      <div className="home-review-person">{review.user?.avatar ? <ResponsiveImage src={review.user.avatar} alt="" className="home-review-avatar" width={28} height={28} imageWidth={64} /> : <span className="home-review-initial" aria-hidden="true">{(review.user?.username || 'K').slice(0, 1).toUpperCase()}</span>}<h3>{review.user?.username || 'Khách hàng'}</h3></div>
      <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
    </div>
    <div className="home-review-stars" aria-label={`${review.rating} trên 5 sao`}>{'★'.repeat(Math.round(review.rating))}</div>
    <blockquote title={review.content}>{review.content}</blockquote>
    <Link className="home-review-tour" title={review.tourTitle} to={`/tours/detail/${review.tourId}`}>{review.tourTitle || `Xem tour được đánh giá #${review.tourId}`} <span aria-hidden="true">→</span></Link>
  </article>);
  return <div className={`home-review-row ${offset ? 'home-review-row--offset' : ''} ${reviews.length === 1 ? 'home-review-row--single' : ''}`}>
    <div className="home-review-track" style={{ '--review-duration': `${duration}s` } as CSSProperties}>
      <div ref={group} className="home-review-group">{cards}</div>
      {reviews.length > 1 && <div className="home-review-group home-review-duplicate" aria-hidden="true" inert>{cards}</div>}
    </div>
  </div>;
}
export default function Rating() {
  const motion = useHomeMotion();
  const root = useRef<HTMLElement>(null);
  const [reviews, setReviews] = useState<NamedReview[]>([]);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void getHighReviews(10).then(async res => {
      if (controller.signal.aborted || res.code !== 1000) return;
      const items: NamedReview[] = res.result.filter(review => review.rating >= 4 && review.content?.trim()).slice(0, 10);
      setReviews(items);
      const ids = [...new Set(items.filter(item => !item.tourTitle).map(item => item.tourId))];
      const titles = new Map<number, string>();
      // Resolve distinct tour names with two requests at a time on small local servers.
      for (let i = 0; i < ids.length && !controller.signal.aborted; i += 2) {
        await Promise.allSettled(ids.slice(i, i + 2).map(async id => {
          const tour = await getTourById(id, controller.signal);
          if (tour.code === 1000) titles.set(id, tour.result.tourTitle);
        }));
      }
      if (!controller.signal.aborted) setReviews(items.map(item => ({ ...item, tourTitle: item.tourTitle || titles.get(item.tourId) })));
    }).catch(() => { /* Reviews remain optional; no invented fallback testimonials. */ });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!root.current) return;
    let visible = false;
    const sync = () => setRunning(visible && !document.hidden && motion.enabled);
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); });
    observer.observe(root.current); document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [reviews.length, motion.enabled]);
  if (!reviews.length) return null;
  const rows = reviews.length >= 4 ? [reviews.filter((_, index) => index % 2 === 0), reviews.filter((_, index) => index % 2 === 1)] : [reviews];
  return <section ref={root} className={`home-section home-reviews ${!running ? 'is-paused' : ''}`}>
    <Container><div className="home-section-heading"><p className="home-eyebrow">SAU MỖI HÀNH TRÌNH</p><h2>Sau chuyến đi, khách hàng chia sẻ gì?</h2><p>Những trải nghiệm được khách hàng chia sẻ sau hành trình.</p></div></Container>
    <div className="home-review-window" tabIndex={reviews.length > 1 ? 0 : undefined} role="region" aria-label="Đánh giá tốt từ khách hàng">{rows.map((row, index) => <ReviewRow key={index} reviews={row} offset={index === 1} />)}</div>
  </section>;
}

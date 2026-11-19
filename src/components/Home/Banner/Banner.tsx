import { useHomeMotion } from '../homeMotionContext';
import banner from '@/assets/images/hero-halong-1600.webp';
import bannerSmall from '@/assets/images/hero-halong-960.webp';
import bannerLarge from '@/assets/images/hero-halong-2560.webp';
import Tours from './Tours';
import Container from '@/components/Share/Container';
import { Link } from 'react-router-dom';
export default function Banner() {
  const motion = useHomeMotion();
  return <section className="home-banner" aria-label="Khám phá Việt Nam">
    <div className="home-original-hero home-welcome-hero">
      <button type="button" className="home-motion-choice" aria-label={motion.enabled ? 'Tắt chuyển động' : 'Bật chuyển động'} title={motion.enabled ? 'Tắt chuyển động' : 'Bật chuyển động'} aria-pressed={motion.enabled} onClick={motion.toggle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={motion.enabled ? 'M15.75 5.25v13.5m-7.5-13.5v13.5' : 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'} />
        </svg>
      </button><img src={banner} srcSet={`${bannerSmall} 960w, ${banner} 1600w, ${bannerLarge} 2560w`} sizes="100vw" width={2560} height={1440} loading="eager" fetchPriority="high" decoding="async"
      alt="Những đảo đá vôi giữa làn nước xanh của vịnh Hạ Long, Việt Nam" />
      <Container className="home-welcome-copy"><p className="home-eyebrow">TOUR DU LỊCH VIỆT NAM</p>
        <h1>Khám phá Việt Nam<br />cùng SGU Tour</h1><p>Tìm tour, chọn ngày khởi hành và đặt chuyến đi phù hợp với bạn.</p>
        <Link to="/#tour-noi-bat">Chưa biết đi đâu? Xem tour gợi ý <span aria-hidden="true">↓</span></Link>
      </Container>
    </div>
    <Container className="home-search-position"><div className="home-search"><Tours /></div></Container>
  </section>;
}

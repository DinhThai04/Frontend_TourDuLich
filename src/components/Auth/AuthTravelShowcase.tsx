import { memo, useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { MapPin, Pause, Play } from 'lucide-react';
import haLongImg from '@/assets/images/hero-halong-1600.webp';
import trangAnImg from '@/assets/images/auth/trang-an-ninh-binh.webp';
import haGiangImg from '@/assets/images/auth/ma-pi-leng-ha-giang.webp';
import phuQuocImg from '@/assets/images/auth/phu-quoc-kien-giang.webp';
import quangNamImg from '@/assets/images/auth/quang-nam-di-san.webp';

interface SlideItem {
  id: string;
  src: string;
  location: string;
  alt: string;
  position: string;
  scrimMid: number;
  scrimBottom: number;
}

const SLIDES: readonly SlideItem[] = [
  {
    id: 'ha-long',
    src: haLongImg,
    location: 'Vịnh Hạ Long, Quảng Ninh',
    alt: 'Những đảo đá vôi giữa làn nước xanh ngọc tại Vịnh Hạ Long, Quảng Ninh',
    position: '50% 48%',
    scrimMid: 0.44,
    scrimBottom: 0.82,
  },
  {
    id: 'trang-an',
    src: trangAnImg,
    location: 'Tràng An, Ninh Bình',
    alt: 'Phong cảnh núi đá vôi và dòng sông xanh tại Tràng An, Ninh Bình',
    position: '50% 44%',
    scrimMid: 0.46,
    scrimBottom: 0.84,
  },
  {
    id: 'ha-giang',
    src: haGiangImg,
    location: 'Đèo Mã Pì Lèng, Hà Giang',
    alt: 'Cung đường núi hùng vĩ đèo Mã Pì Lèng, Hà Giang',
    position: '50% 42%',
    scrimMid: 0.48,
    scrimBottom: 0.85,
  },
  {
    id: 'phu-quoc',
    src: phuQuocImg,
    location: 'Phú Quốc, Kiên Giang',
    alt: 'Biển xanh và bờ cát nắng ấm tại Phú Quốc, Kiên Giang',
    position: '50% 58%',
    scrimMid: 0.50,
    scrimBottom: 0.86,
  },
  {
    id: 'quang-nam',
    src: quangNamImg,
    location: 'Đông Giang, Quảng Nam',
    alt: 'Cảnh sắc thiên nhiên miền Trung tại Quảng Nam',
    position: '50% 46%',
    scrimMid: 0.46,
    scrimBottom: 0.84,
  },
];

const SLIDE_INTERVAL_MS = 6500;

interface AuthTravelShowcaseProps {
  mode: 'login' | 'register';
  motionEnabled: boolean;
  onToggleMotion: () => void;
}

function AuthTravelShowcaseComponent({ mode, motionEnabled, onToggleMotion }: AuthTravelShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tabHidden, setTabHidden] = useState(false);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(() => new Set([0, 1]));

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const nextIndex = (activeIndex + 1) % SLIDES.length;
    setLoadedSlides((prev) => {
      if (prev.has(nextIndex)) return prev;
      const next = new Set(prev);
      next.add(nextIndex);
      return next;
    });
  }, [activeIndex]);

  const isAutoPlaying = motionEnabled && !tabHidden;

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying]);

  const selectSlide = (idx: number) => {
    const normalized = (idx + SLIDES.length) % SLIDES.length;
    setLoadedSlides((prev) => new Set(prev).add(normalized));
    setActiveIndex(normalized);
  };

  const handleIndicatorKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectSlide(activeIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectSlide(activeIndex - 1);
    }
  };

  const currentSlide = SLIDES[activeIndex] ?? SLIDES[0]!;

  const headline =
    mode === 'login'
      ? 'Mỗi chuyến đi,\nmột câu chuyện mới.'
      : 'Hành trình tuyệt vời\nbắt đầu từ đây.';

  const subtitle =
    mode === 'login'
      ? 'Cùng SGU Tour khám phá vẻ đẹp Việt Nam, từ những đỉnh núi hùng vĩ đến những bãi biển thơ mộng.'
      : 'Gia nhập SGU Tour và sẵn sàng khám phá những điểm đến tiếp theo của bạn.';

  return (
    <aside className="auth-showcase-col" aria-label="Phong cảnh du lịch Việt Nam">
      <div
        className="auth-showcase"
        style={
          {
            '--scrim-mid': currentSlide.scrimMid,
            '--scrim-bottom': currentSlide.scrimBottom,
          } as CSSProperties
        }
      >
        {/* Background Slides */}
        {SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const shouldRenderImg = loadedSlides.has(idx) || isActive;
          return (
            <div
              key={slide.id}
              className={`auth-slide-layer ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              {shouldRenderImg && (
                <img
                  key={isActive ? `${slide.id}-active` : slide.id}
                  src={slide.src}
                  alt={slide.alt}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding="async"
                  style={{ objectPosition: slide.position }}
                  className={`auth-slide-img ${motionEnabled ? 'is-animating' : ''}`}
                />
              )}
            </div>
          );
        })}

        {/* Natural Premium Bottom-Focused Scrim */}
        <div className="auth-showcase-overlay" aria-hidden="true" />

        {/* Subtle Topographic Map Contour Decoration */}
        <svg
          className="auth-showcase-topo"
          viewBox="0 0 600 800"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path d="M-40 160 C 120 110, 260 220, 420 150 C 520 105, 580 140, 640 120" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="6 8" />
          <path d="M-20 620 C 140 560, 310 660, 490 580 C 560 550, 610 570, 660 545" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 8" />
        </svg>

        {/* Top Bar: Eyebrow + Pause/Play */}
        <div className="auth-showcase-top">
          <span className="auth-eyebrow-pill">
            <span className="auth-eyebrow-dot" aria-hidden="true" />
            Khám phá Việt Nam
          </span>
          <button
            type="button"
            className="auth-pause-btn"
            onClick={onToggleMotion}
            aria-label={motionEnabled ? 'Tạm dừng trình chiếu ảnh' : 'Tiếp tục trình chiếu ảnh'}
            aria-pressed={!motionEnabled}
            title={motionEnabled ? 'Tạm dừng chuyển động' : 'Bật chuyển động'}
          >
            {motionEnabled ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>

        {/* Bottom Copy + Destination Caption + Animated Progress Indicators */}
        <div className="auth-showcase-bottom">
          <div key={mode} className="auth-copy-transition">
            <h2 className="auth-headline">{headline}</h2>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          <div className="auth-showcase-footer">
            <div key={currentSlide.id} className="auth-location-chip auth-copy-transition" aria-live="polite">
              <MapPin size={15} strokeWidth={2.2} aria-hidden="true" />
              <span className="truncate">{currentSlide.location}</span>
            </div>

            <div
              className="auth-indicators"
              role="tablist"
              aria-label="Chọn ảnh phong cảnh"
              onKeyDown={handleIndicatorKeyDown}
            >
              {SLIDES.map((slide, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Xem ảnh ${slide.location}`}
                    className={`auth-indicator-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => selectSlide(idx)}
                  >
                    {isActive && (
                      <span
                        key={`${slide.id}-${activeIndex}-${motionEnabled}`}
                        className={`auth-indicator-fill ${!motionEnabled ? 'is-static' : ''}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

const AuthTravelShowcase = memo(AuthTravelShowcaseComponent);
export default AuthTravelShowcase;

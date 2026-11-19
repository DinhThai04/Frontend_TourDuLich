import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import Slider from '@/components/Share/TourSlider';
import type SlickSlider from 'react-slick';
import { useHomeAutoplay } from './useHomeAutoplay';

export default function HomeRail({ children, label, delay = 7500, resetKey = '', destinations = false }: {
  children: ReactNode[]; label: string; delay?: number; resetKey?: string; destinations?: boolean;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const slider = useRef<SlickSlider>(null);
  const [index, setIndex] = useState(0);
  const count = children.length;
  const columnsAtWidth = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 3;
  const [columns, setColumns] = useState(columnsAtWidth);
  useEffect(() => {
    const resize = () => setColumns(columnsAtWidth());
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const shown = Math.min(count, columns);
  useHomeAutoplay(wrapper, delay, count > columns, () => slider.current?.slickNext(), '[data-home-pause]');
  return <div ref={wrapper} className={`home-rail home-slick-rail ${count === 1 ? 'home-rail--one' : ''} ${destinations ? 'home-destination-rail' : 'home-tour-rail'}`}>
    {count > columns && <div className="home-rail-controls">
      <span className="home-rail-position" aria-hidden="true">{index + 1} / {count}</span>
      <button type="button" aria-label={`${label} trước`} onClick={() => slider.current?.slickPrev()}><LeftOutlined /></button>
      <button type="button" aria-label={`${label} tiếp theo`} onClick={() => slider.current?.slickNext()}><RightOutlined /></button>
    </div>}
    <div data-home-pause role="region" aria-label={label}>
      <Slider key={`${resetKey}-${count}-${columns}`} ref={slider} slidesToShow={shown} slidesToScroll={1}
        infinite={count > shown} speed={1100} cssEase="cubic-bezier(.25,1,.35,1)" arrows={false} dots={count > shown}
        accessibility swipe draggable waitForAnimate afterChange={setIndex}
      >
        {children.map((child, i) => <div key={i} className="home-rail-slide">{child}</div>)}
      </Slider>
    </div>
  </div>;
}

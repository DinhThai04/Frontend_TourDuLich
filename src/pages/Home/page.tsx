import HomeMotionProvider from '@/components/Home/HomeMotionProvider';
import HomeCatalogProvider from '@/components/Home/HomeCatalogProvider';
import { useHomeMotion } from '@/components/Home/homeMotionContext';
import '@/components/Home/homepage.css';
import { lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Banner from '@/components/Home/Banner/Banner';
import DeferredSection from '@/components/Share/DeferredSection';
const Slide = lazy(() => import('@/components/Home/Slide/Slide'));
const Explore = lazy(() => import('@/components/Home/Explore/Explore'));
const PopularTours = lazy(() => import('@/components/Home/PopularTours/PopularTours'));
const Highlights = lazy(() => import('@/components/Home/Highlights/Highlights'));
const Rating = lazy(() => import('@/components/Home/Rating/Rating'));

const HomeContent = () => {
  const motion = useHomeMotion();
  const { hash, search, key } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: motion.enabled ? 'smooth' : 'auto', block: 'start' });
  }, [hash, search, key, motion.enabled]);

  useEffect(() => {
    if (!motion.enabled) return;
    const root = document.querySelector('.home-page');
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-arrived'); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    const scan = () => root.querySelectorAll('.home-section-heading:not(.home-reveal), .home-experience-card:not(.home-reveal), .home-flow-guide li:not(.home-reveal)').forEach(node => {
      (node as HTMLElement).style.setProperty('--reveal-delay', `${Array.from(node.parentElement?.children ?? []).indexOf(node) % 4 * 80}ms`);
      node.classList.add('home-reveal'); observer.observe(node);
    });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); root.querySelectorAll('.home-reveal').forEach(node => node.classList.remove('home-reveal', 'is-arrived')); };
  }, [motion.enabled]);

  return (
    <div className="home-page">
      <Banner />
      <DeferredSection id="cam-hung" height={500} label="cảm hứng"><Slide /></DeferredSection>
      <DeferredSection id="diem-den-noi-bat" height={440} label="địa điểm"><Explore /></DeferredSection>
      <DeferredSection id="tour-noi-bat" height={540} label="tour gợi ý"><PopularTours key={key} /></DeferredSection>
      <DeferredSection id="diem-noi-bat" height={420} label="điểm nổi bật"><Highlights /></DeferredSection>
      <DeferredSection id="danh-gia" height={450} label="đánh giá"><Rating /></DeferredSection>
    </div>
  );
};

export default function HomePage() {
  return <HomeMotionProvider><HomeCatalogProvider><HomeContent /></HomeCatalogProvider></HomeMotionProvider>;
}

import HomeMotionProvider from '@/components/Home/HomeMotionProvider';
import HomeCatalogProvider from '@/components/Home/HomeCatalogProvider';
import { useHomeMotion } from '@/components/Home/homeMotionContext';
import '@/components/Home/homepage.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { searchTours } from '@/services/tourServices';
import Banner from '@/components/Home/Banner/Banner';
import Slide from '@/components/Home/Slide/Slide';
import Explore from '@/components/Home/Explore/Explore';
import PopularTours from '@/components/Home/PopularTours/PopularTours';
import Highlights from '@/components/Home/Highlights/Highlights';
import Rating from '@/components/Home/Rating/Rating';

const HomeContent = () => {
  const motion = useHomeMotion();
  const { hash, search, key } = useLocation();

  useEffect(() => {
    // Prefetch first page of tour list in background so switching to /tours is instant.
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchTours(new URLSearchParams('page=0&size=6'), controller.signal).catch(() => {});
    }, 800);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, []);

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
      <div id="cam-hung"><Slide /></div>
      <div id="diem-den-noi-bat"><Explore /></div>
      <div id="tour-noi-bat"><PopularTours key={key} /></div>
      <div id="diem-noi-bat"><Highlights /></div>
      <div id="danh-gia"><Rating /></div>
    </div>
  );
};

export default function HomePage() {
  return <HomeMotionProvider><HomeCatalogProvider><HomeContent /></HomeCatalogProvider></HomeMotionProvider>;
}

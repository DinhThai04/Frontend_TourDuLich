import { lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Banner from '@/components/Home/Banner/Banner';
import DeferredSection from '@/components/Share/DeferredSection';
import ChatbotWidget from '@/layouts/ChatBot';
const Explore = lazy(() => import('@/components/Home/Explore/Explore'));
const PopularTours = lazy(() => import('@/components/Home/PopularTours/PopularTours'));
const Highlights = lazy(() => import('@/components/Home/Highlights/Highlights'));
const Slide = lazy(() => import('@/components/Home/Slide/Slide'));
const Rating = lazy(() => import('@/components/Home/Rating/Rating'));

const HomePage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <>
      <Banner />
      <DeferredSection id="uu-dai" height={400} label="ưu đãi"><Slide /></DeferredSection>
      <DeferredSection id="diem-den-noi-bat" height={440} label="địa điểm"><Explore /></DeferredSection>
      <ChatbotWidget />
      <DeferredSection id="tour-noi-bat" height={640} label="tour nổi bật"><PopularTours /></DeferredSection>
      <DeferredSection id="danh-gia" height={420} label="đánh giá"><Rating /></DeferredSection>
      <DeferredSection id="diem-noi-bat" height={300} label="điểm nổi bật"><Highlights /></DeferredSection>
    </>
  );
};

export default HomePage;

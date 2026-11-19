import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/branding/sgu-tour-icon.svg';
import './css/ChatbotWidget.css';
import { customerRoute } from './customerRoutes';
import { getTourById } from '@/services/tourServices';
import { useAiConversation } from '@/components/AI/AiConversationContext';
import type { ChatPageContext } from '@/components/AI/chatPageContext';
const ChatbotPanel = lazy(() => import('../components/AI/ChatbotPanel'));
export default function ChatbotWidget({ visible = true, checkout = false }: { visible?: boolean; checkout?: boolean }) {
  const location = useLocation();
  const route = customerRoute(location.pathname);
  const conversation = useAiConversation();
  const wrapper = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [tour, setTour] = useState<{ id: number; title: string } | null>(null);
  useEffect(() => { setIsOpen(false); }, [location.pathname]);
  useEffect(() => { if (!visible) conversation.pause(); }, [visible, conversation]);
  useEffect(() => {
    if (!route.tourId) return;
    const controller = new AbortController();
    void getTourById(route.tourId, controller.signal).then(res => {
      if (!controller.signal.aborted && res.code === 1000) setTour({ id: res.result.id, title: res.result.tourTitle });
    }).catch(() => { /* Context remains optional; the assistant can still answer. */ });
    return () => controller.abort();
  }, [route.tourId]);
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const measure = () => {
      const right = innerWidth - (innerWidth <= 520 ? 16 : 24); const left = right - 64;
      let bottom = innerWidth <= 520 ? 16 : 24;
      const targets = [...document.querySelectorAll<HTMLElement>('.customer-shell main button.ant-btn-primary, .customer-shell main a.ant-btn-primary')].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height && r.top < innerHeight && r.bottom > 0);
      for (let pass = 0; pass < targets.length + 1; pass += 1) {
        const collision = targets.find(r => r.right > left && r.left < right && r.bottom > innerHeight - bottom - 64 && r.top < innerHeight - bottom);
        if (!collision) break;
        bottom = Math.max(bottom, innerHeight - collision.top + 12);
      }
      wrapper.current?.style.setProperty('--assistant-bottom', `${Math.min(bottom, innerHeight - 100)}px`);
      frame = 0;
    };
    const update = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(update); observer.observe(document.body);
    const mutations = new MutationObserver(update); const main = document.querySelector('.customer-shell main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); mutations.disconnect(); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [visible, location.pathname, isOpen]);
  const invoice = location.pathname.match(/^\/invoice\/booking\/(\d+)$/);
  const context: ChatPageContext = checkout ? { kind: 'checkout', bookingId: invoice ? Number(invoice[1]) : undefined } : route.tourId ? { kind: 'tour', tourId: route.tourId, tourTitle: tour?.id === route.tourId ? tour.title : undefined } : location.pathname === '/policies' ? { kind: 'policies' } : { kind: 'general' };
  const open = () => { setOpened(true); setIsOpen(true); };
  return <div ref={wrapper} className={`customer-assistant ${checkout ? 'customer-assistant--checkout' : ''}`} hidden={!visible}>
    {!isOpen && <div className="chatbot-toggle-container"><button type="button" className="chatbot-toggle-btn" aria-label="Mở trợ lý SGU Tour" title="Tư vấn tour cùng SGU Tour" onClick={open}><img src={logo} alt="" width={44} height={44} /></button></div>}
    {opened && <div hidden={!isOpen || !visible}><Suspense fallback={<section className="chatbot-floating-container" role="status" aria-label="Đang tải trợ lý"><div className="chatbot-header"><strong>Đang tải trợ lý…</strong><button onClick={() => setIsOpen(false)} aria-label="Thu nhỏ trợ lý">Đóng</button></div></section>}><ChatbotPanel isOpen={isOpen && visible} onClose={() => setIsOpen(false)} context={context} /></Suspense></div>}
  </div>;
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import logo from '../assets/branding/sgu-tour-icon.svg';
import './css/ChatbotWidget.css';
import { customerRoute } from './customerRoutes';
import { useAiConversation } from '@/components/AI/AiConversationContext';
import type { ChatPageContext } from '@/components/AI/chatPageContext';
import { departureIdFromSearch } from '@/utils/tourSchedule';

const ChatbotPanel = lazy(() => import('../components/AI/ChatbotPanel'));

export default function ChatbotWidget({ visible = true, checkout = false, tourTitle }: {
  visible?: boolean; checkout?: boolean; tourTitle?: string;
}) {
  const location = useLocation();
  const route = customerRoute(location.pathname);
  const conversation = useAiConversation();
  const [isOpen, setIsOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);
  useEffect(() => { if (!visible) conversation.pause(); }, [visible, conversation]);

  useEffect(() => {
    if (!visible || isOpen) {
      setHiddenOnScroll(false);
      return;
    }
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      if (current < 120) {
        setHiddenOnScroll(false);
      } else if (delta > 12) {
        setHiddenOnScroll(true);
      } else if (delta < -8) {
        setHiddenOnScroll(false);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [visible, isOpen]);

  const invoice = location.pathname.match(/^\/invoice\/booking\/(\d+)$/);
  const context: ChatPageContext = checkout
    ? { kind: 'checkout', bookingId: invoice ? Number(invoice[1]) : undefined }
    : route.tourId
      ? { kind: 'tour', tourId: route.tourId, tourTitle,
          departureId: departureIdFromSearch(location.search) ?? undefined }
      : { kind: location.pathname === '/policies' ? 'policies' : 'general' };

  const open = () => { setOpened(true); setIsOpen(true); };

  return (
    <div className={`customer-assistant ${checkout ? 'customer-assistant--checkout' : ''}`} hidden={!visible}>
      {!isOpen && (
        <div className={`chatbot-toggle-container ${hiddenOnScroll ? 'is-hidden-scroll' : ''}`}>
          <Tooltip title="Hỗ trợ" placement="left">
            <button
              type="button"
              className="chatbot-toggle-btn !w-[56px] !h-[56px] !rounded-full !bg-[#1F7A6E] hover:!bg-[#176258] !border-2 !border-white shadow-[0_8px_24px_rgba(19,78,72,0.28)] flex items-center justify-center transition-colors"
              aria-label="Mở chat hỗ trợ"
              onClick={open}
            >
              <img src={logo} alt="" className="!w-8 !h-8 !rounded-full bg-white p-0.5" width={32} height={32} />
            </button>
          </Tooltip>
        </div>
      )}
      {opened && (
        <div hidden={!isOpen || !visible}>
          <Suspense fallback={
            <section className="chatbot-floating-container" role="status" aria-label="Đang tải trợ lý">
              <div className="chatbot-header">
                <strong>Đang tải trợ lý…</strong>
                <button onClick={() => setIsOpen(false)} aria-label="Thu nhỏ trợ lý">Đóng</button>
              </div>
            </section>
          }>
            <ChatbotPanel isOpen={isOpen && visible} onClose={() => setIsOpen(false)} context={context} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

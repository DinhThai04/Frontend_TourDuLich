import { lazy, Suspense, useState } from 'react';
import logo from '../assets/branding/sgu-tour-icon.svg';
import './css/ChatbotWidget.css';
const ChatbotPanel = lazy(() => import('../components/AI/ChatbotPanel'));

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const open = () => { setOpened(true); setIsOpen(true); };
  return <>
    {!isOpen && <div className="chatbot-toggle-container">
      <button className="chatbot-toggle-btn" aria-label="Mở trợ lý SGU Tour" title="Tư vấn tour cùng SGU Tour" onClick={open}>
        <img src={logo} alt="" width={44} height={44} />
      </button>
    </div>}
    {opened && <div hidden={!isOpen}>
      <Suspense fallback={<section className="chatbot-floating-container" role="status" aria-label="Đang tải trợ lý">
        <div className="chatbot-header"><strong>Đang tải trợ lý…</strong><button onClick={() => setIsOpen(false)} aria-label="Thu nhỏ trợ lý">Đóng</button></div>
      </section>}>
        <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </Suspense>
    </div>}
  </>;
}

import Container from '@/components/Share/Container';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useHomeMotion } from '../homeMotionContext';
const steps = [
  ['Chọn tour', 'Xem điểm đến, lịch trình và giá tour.'],
  ['Chọn lịch khởi hành', 'Chọn ngày đi phù hợp với kế hoạch.'],
  ['Điền hành khách và thanh toán', 'Kiểm tra thông tin và hạn giữ chỗ trước khi trả tiền.'],
  ['Theo dõi đơn đặt tour', 'Xem trạng thái đặt chỗ trong tài khoản.'],
];
const horizontal = 'M125 50 C190 -4 310 -4 375 50 C440 104 560 104 625 50 C690 -4 810 -4 875 50';
const vertical = 'M40 125 C116 190 116 310 40 375 C-36 440 -36 560 40 625 C116 690 116 810 40 875';
function RouteArrow({ path, enabled }: { path: string; enabled: boolean }) {
  return <><path d={path} className="home-guide-curve" />{enabled && <g className="home-guide-moving-arrow">
    <g className="home-guide-arrow-shape"><path d="M-18 0 H-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M-6 -5 L3 0 L-6 5 Z" fill="currentColor" /></g>
    <animateMotion path={path} dur="12s" repeatCount="indefinite" rotate="auto" keyPoints="0;.333333;.666667;1" keyTimes="0;.333333;.666667;1" calcMode="linear" />
  </g>}</>;
}
export default function Highlights() {
  const motion = useHomeMotion();
  const board = useRef<HTMLDivElement>(null);
  const desktop = useRef<SVGSVGElement>(null);
  const mobile = useRef<SVGSVGElement>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!board.current) return;
    let visible = false;
    const sync = () => {
      const active = visible && motion.enabled && !document.hidden;
      setRunning(active);
      [desktop.current, mobile.current].forEach(svg => {
        if (!svg) return;
        if (active && getComputedStyle(svg).display !== 'none') svg.unpauseAnimations(); else svg.pauseAnimations();
      });
    };
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); });
    const resize = new ResizeObserver(sync);
    observer.observe(board.current); resize.observe(board.current); document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); resize.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [motion.enabled]);
  return <section className="home-section home-booking-guide home-flow-guide"><Container>
    <div className="home-section-heading"><p className="home-eyebrow">SẴN SÀNG CHO CHUYẾN ĐI?</p><h2>Đặt chuyến đi, từng bước rõ ràng</h2><p>Từ chọn hành trình đến theo dõi đơn đặt tour, bạn luôn biết bước tiếp theo.</p></div>
    <div ref={board} className={`home-guide-route ${running ? 'is-running' : ''}`}>
      <svg ref={desktop} className="home-guide-route-horizontal" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><RouteArrow path={horizontal} enabled={motion.enabled} /></svg>
      <svg ref={mobile} className="home-guide-route-vertical" viewBox="0 0 120 1000" preserveAspectRatio="none" aria-hidden="true"><RouteArrow path={vertical} enabled={motion.enabled} /></svg>
      <ol>{steps.map(([title, text], index) => <li key={title}><span className="home-step-number">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    </div>
    <Link className="home-text-link home-guide-link" to="/policies">Xem hướng dẫn và chính sách đặt tour <span aria-hidden="true">→</span></Link>
  </Container></section>;
}

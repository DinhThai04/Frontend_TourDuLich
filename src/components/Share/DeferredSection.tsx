import { useEffect, useRef, useState, Suspense } from 'react';
import type { ReactNode } from 'react';

/** Reserve space and load a below-fold section shortly before it enters the viewport. */
export default function DeferredSection({ children, height, label, id }: { children: ReactNode; height: number; label: string; id?: string }) {
  const target = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (visible || !target.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(target.current);
    return () => observer.disconnect();
  }, [visible]);
  const placeholder = <div role="status" aria-label={`Đang tải ${label}`} style={{ minHeight: height }} />;
  return <div ref={target} id={id} style={{ minHeight: height, scrollMarginTop: '88px' }}>
    {visible ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
  </div>;
}

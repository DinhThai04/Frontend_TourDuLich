import Navbar from '@/components/Share/Navbar/Navbar';
import { Outlet, useBlocker, useLocation } from 'react-router-dom';
import { Footer as MyFooter } from '@/components/Share/Footer';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ChatbotWidget from './ChatBot';
import { customerRoute } from './customerRoutes';
import './css/CustomerShell.css';
import { BookingDraftContext } from './BookingDraftContext';
export default function MainLayout() {
  const location = useLocation();
  const route = customerRoute(location.pathname);
  const dirty = useRef(false);
  const markDirty = useCallback(() => { dirty.current = true; }, []);
  const clearDraft = useCallback(() => { dirty.current = false; }, []);
  const draft = useMemo(() => ({ markDirty, clearDraft }), [markDirty, clearDraft]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, []);
  const allowLeave = useCallback(() => {
    if (dirty.current && !window.confirm('Bạn đang có thông tin hành khách chưa gửi. Rời trang này?')) return false;
    clearDraft();
    return true;
  }, [clearDraft]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty.current &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (allowLeave()) blocker.proceed();
    else blocker.reset();
  }, [blocker, allowLeave]);
  return <BookingDraftContext.Provider value={draft}><div className="customer-shell">
    <header className="customer-header-shell"><Navbar allowLeave={allowLeave} /></header>
    <main><Outlet /></main>
    <footer><MyFooter /></footer>
    <ChatbotWidget visible={route.assistantVisible} checkout={route.checkoutStep !== null} />
  </div></BookingDraftContext.Provider>;
}

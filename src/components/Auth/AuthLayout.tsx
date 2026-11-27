import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AuthTravelShowcase from './AuthTravelShowcase';
import './auth.css';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const mode: 'login' | 'register' = pathname.startsWith('/register') ? 'register' : 'login';
  const [motionEnabled, setMotionEnabled] = useState(() => {
    try {
      return localStorage.getItem('sgu.auth.motion') !== 'reduced';
    } catch {
      return true;
    }
  });

  const toggleMotion = useCallback(() => {
    setMotionEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sgu.auth.motion', next ? 'full' : 'reduced');
      } catch {
        // optional
      }
      return next;
    });
  }, []);

  return (
    <div
      className={`auth-shell ${mode === 'register' ? 'auth-shell--register' : 'auth-shell--login'}`}
      data-auth-motion={motionEnabled ? 'full' : 'reduced'}
    >
      <AuthTravelShowcase mode={mode} motionEnabled={motionEnabled} onToggleMotion={toggleMotion} />
      <main className="auth-form-col">
        <div key={mode} className="auth-form-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

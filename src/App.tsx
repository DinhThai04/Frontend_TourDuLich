import './journey.css';
import { appTheme } from '@/config/theme';
import AppRoutes from '@routes/AppRoutes';

import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';
import { useSyncExternalStore, type PropsWithChildren } from 'react';

const reduceMotionQuery = '(prefers-reduced-motion: reduce)';
const reducedTheme = { ...appTheme, token: { ...appTheme.token, motion: false } };

function subscribeToMotion(change: () => void) {
  const media = window.matchMedia(reduceMotionQuery);
  media.addEventListener('change', change);
  return () => media.removeEventListener('change', change);
}

export function AppConfiguration({ children }: PropsWithChildren) {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia(reduceMotionQuery).matches);
  return <ConfigProvider locale={viVN} theme={reducedMotion ? reducedTheme : appTheme}>{children}</ConfigProvider>;
}

export default function App() {
  return <AppConfiguration><AppRoutes /></AppConfiguration>;
}

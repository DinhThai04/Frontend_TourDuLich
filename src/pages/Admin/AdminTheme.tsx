import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';

export default function AdminTheme({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={{
    token: {
      colorPrimary: '#1F7A6E', colorPrimaryHover: '#176258', colorInfo: '#1F7A6E', colorInfoBg: '#E6F4F1',
      colorInfoBorder: '#A7D7CF', colorLink: '#176258', colorLinkHover: '#134E48', colorText: '#1F2937',
      colorTextSecondary: '#6B7280', colorBorder: '#E5E7EB', colorWarning: '#B45309',
      colorSuccess: '#166534', colorError: '#991B1B',
    },
    components: { Rate: { starColor: '#F59E0B' }, Table: { headerBg: '#F8FAFA', rowHoverBg: '#F8FAFA' } },
  }}>{children}</ConfigProvider>;
}

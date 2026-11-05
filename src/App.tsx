import AppRoutes from '@routes/AppRoutes';

import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';
export default function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AppRoutes />
    </ConfigProvider>
  );
}

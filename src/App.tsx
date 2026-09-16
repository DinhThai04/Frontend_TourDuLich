import AppRoutes from '@routes/AppRoutes';

import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';
import { Bounce, ToastContainer } from 'react-toastify';
export default function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </ConfigProvider>
  );
}

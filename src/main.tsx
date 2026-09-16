import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store, persistor } from '@/store/index';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import './index.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import hàm inject vừa tạo
import { injectPersistor } from '@/api/axios'; // Đường dẫn tới file axios của bạn
injectPersistor(persistor);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

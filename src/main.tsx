import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from '@/components/Share/ErrorBoundary';
import { store, persistor } from '@/store/index';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import './index.css';

// Static message/notification/modals render in their own root, outside the app tree.
// Give that root the app locale and register holderRender (otherwise antd warns that
// static functions cannot consume context).
ConfigProvider.config({
  holderRender: (children) => <ConfigProvider locale={viVN}>{children}</ConfigProvider>,
});

// Import hàm inject vừa tạo
import { injectPersistor, injectSessionHooks } from '@/api/axios';
import { sessionService } from '@/services/sessionServices';
import { sessionRefreshed, sessionExpired, refreshCurrentUser } from '@/store/slices/authSlice'; // Đường dẫn tới file axios của bạn
injectPersistor(persistor);
injectSessionHooks({
  refreshed: result => { store.dispatch(sessionRefreshed(result)); },
  expired: () => { store.dispatch(sessionExpired()); },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
          onBeforeLift={() => {
            const { isAuth } = store.getState().auth;
            // A persisted isAuth without a token is a half-cleared session; expire it
            // instead of rendering an authenticated shell that can only receive 401s.
            if (isAuth && !sessionService.getToken()) {
              store.dispatch(sessionExpired());
              return;
            }
            // Rehydrated roles may be stale after an admin changed them; refresh once per start.
            if (isAuth) void store.dispatch(refreshCurrentUser());
          }}
        >
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
  </React.StrictMode>
);

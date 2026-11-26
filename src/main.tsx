import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { AppConfiguration } from './App';
import ErrorBoundary from '@/components/Share/ErrorBoundary';
import { store, persistor } from '@/store/index';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import './index.css';
import './pages/Admin/admin.css';

// Static message/notification/modals render in their own root, outside the app tree.
// Give that root the app locale and register holderRender (otherwise antd warns that
// static functions cannot consume context).
ConfigProvider.config({
  holderRender: (children) => <AppConfiguration>{children}</AppConfiguration>,
});

// Import hàm inject vừa tạo
import { injectPersistor, injectSessionHooks } from '@/api/axios';
import { sessionService } from '@/services/sessionServices';
import { sessionRefreshed, sessionExpired, sessionShared, refreshCurrentUser } from '@/store/slices/authSlice'; // Đường dẫn tới file axios của bạn
injectPersistor(persistor);
injectSessionHooks({
  refreshed: result => { store.dispatch(sessionRefreshed(result)); },
  expired: () => { store.dispatch(sessionExpired()); },
});

window.addEventListener('storage', event => {
  if (event.storageArea !== localStorage || (event.key !== 'token' && event.key !== null)) return;
  const token = sessionService.getToken();
  const user = sessionService.getUser();
  if (token && user) store.dispatch(sessionShared({ token, user }));
  else store.dispatch(sessionExpired());
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
          onBeforeLift={() => {
            const token = sessionService.getToken();
            const user = sessionService.getUser();
            if (token && user) {
              store.dispatch(sessionShared({ token, user }));
              void store.dispatch(refreshCurrentUser());
            } else store.dispatch(sessionExpired());
          }}
        >
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
  </React.StrictMode>
);

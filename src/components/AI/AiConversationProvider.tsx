import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { AiClient } from '../../services/aiServices';
import { AiConversation } from '../../utils/aiConversation';
import { sessionService } from '../../services/sessionServices';
import { API_BASE_URL, refreshSession } from '@/api/axios';
import { jwtDecode } from 'jwt-decode';
import { AiClientError } from '../../services/aiServices';
import axios from 'axios';

import { AiConversationContext as Context } from './AiConversationContext';
export function AiConversationProvider({ children }: { children: ReactNode }) {
  const owner = useSelector((state: RootState) =>
    state.auth.isAuth ? `user:${state.auth.user?.id ?? 'pending'}` : 'guest'
  );
  const [conversation] = useState(() => {
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      /* RAM fallback */
    }
    return new AiConversation(
      new AiClient(
        API_BASE_URL,
        undefined,
        45000,
        () => sessionService.getToken(),
        async stale => {
          const current = sessionService.getToken();
          if (!current) return null;
          try {
            if (jwtDecode<{ sub: string }>(current).sub !== jwtDecode<{ sub: string }>(stale).sub) return null;
          } catch { return null; }
          if (current !== stale) return current;
          const refreshToken = sessionService.getRefreshToken();
          if (!refreshToken) throw new AiClientError('LOGIN_REQUIRED');
          try { return (await refreshSession(refreshToken)).result.token; }
          catch (error) {
            if (!sessionService.getToken() || axios.isAxiosError(error) && [400, 401, 403].includes(error.response?.status ?? 0))
              throw new AiClientError('LOGIN_REQUIRED');
            throw new AiClientError('NETWORK_ERROR', true);
          }
        }
      ),
      storage
    );
  });
  // Mounted across routes so login/logout also resets a chat whose home widget is not visible.
  useLayoutEffect(() => {
    conversation.setOwner(owner);
  }, [conversation, owner]);
  useLayoutEffect(() => () => conversation.pause(), [conversation]);
  return <Context.Provider value={conversation}>{children}</Context.Provider>;
}

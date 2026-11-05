import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { message } from 'antd';

export default function GoogleSignIn({ onSuccess }: { onSuccess: (response: CredentialResponse) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  return <GoogleOAuthProvider clientId={clientId}>
    <GoogleLogin useOneTap onSuccess={onSuccess} onError={() => message.error('Chưa đăng nhập được bằng Google. Vui lòng thử lại.')} />
  </GoogleOAuthProvider>;
}

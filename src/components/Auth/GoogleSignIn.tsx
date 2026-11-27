import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { message } from 'antd';

export default function GoogleSignIn({ onSuccess }: { onSuccess: (response: CredentialResponse) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number>(360);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      // Google Identity button supports 200..400px cleanly
      const measured = Math.floor(containerRef.current.getBoundingClientRect().width);
      if (measured > 0) setButtonWidth(Math.max(240, Math.min(400, measured)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!clientId) return null;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div ref={containerRef} className="flex justify-center w-full">
        <GoogleLogin
          useOneTap
          theme="outline"
          size="large"
          shape="rectangular"
          text="signin_with"
          locale="vi"
          width={String(buttonWidth)}
          onSuccess={onSuccess}
          onError={() => message.error('Chưa đăng nhập được bằng Google. Vui lòng thử lại.')}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

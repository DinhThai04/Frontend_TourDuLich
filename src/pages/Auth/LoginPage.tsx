import { lazy, Suspense, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, loginUserWithGG } from '@/store/slices/authSlice';
import { Alert, Button, Divider, Form, Input, message } from 'antd';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import brand from '@/assets/branding/sgu-tour.svg';
import type { CredentialResponse as GoogleCredentialResponse } from '@react-oauth/google';
import type { RootState } from '@/store';
import { signedInDestination } from '@/config/access';

const GoogleSignIn = lazy(() => import('@/components/Auth/GoogleSignIn'));

/** Accept only same-origin paths; `//host` and `/\host` would be treated as external. */
function safeReturnPath(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== 'string') return null;
  if (!from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return null;
  if (from === '/login' || from.startsWith('/login?') || from.startsWith('/login#')) return null;
  return from;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { loading, error, isAuth, user } = useAppSelector((state: RootState) => state.auth);
  const returnPath = safeReturnPath(location.state)
    ?? safeReturnPath({ from: new URLSearchParams(location.search).get('return') });

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    if (loading) return;
    try {
      const res = await dispatch(loginUser(values)).unwrap();
      if (res.code === 1000) {
        message.success('Đăng nhập thành công!', 3);
        navigate(signedInDestination(res.result.user, returnPath ?? '/'), { replace: true });
      } else {
        message.error('Đăng nhập thất bại!', 3);
      }
    } catch {
      // Lỗi đăng nhập đã được lưu trong state `error` của authSlice và hiển thị bên dưới.
    }
  };

  const handleGGLogin = async (credentialResponse: GoogleCredentialResponse) => {
    const googleToken = credentialResponse.credential;
    if (!googleToken) {
      message.error('Đăng nhập thất bại!');
      return;
    }

    try {
      const res = await dispatch(loginUserWithGG(googleToken)).unwrap();
      if (res.code === 1000) {
        message.success('Đăng nhập thành công!', 3);
        navigate(signedInDestination(res.result.user, returnPath ?? '/'), { replace: true });
      } else {
        message.error('Đăng nhập thất bại!', 3);
      }
    } catch {
      // Thông báo lỗi đã được authSlice cập nhật.
    }
  };

  if (isAuth) {
    return <Navigate to={signedInDestination(user, returnPath ?? '/')} replace />;
  }

  return (
    <section aria-labelledby="login-heading">
      {/* Brand Logo */}
      <div className="auth-stagger-1 auth-brand-wrap mb-5">
        <Link to="/" aria-label="Trang chủ SGU Tour" className="auth-brand-logo inline-block w-[160px]">
          <img src={brand} alt="SGU Tour" className="block w-full h-auto" />
        </Link>
      </div>

      {/* Heading */}
      <header className="auth-stagger-2 auth-heading-wrap mb-5">
        <h1
          id="login-heading"
          ref={headingRef}
          tabIndex={-1}
          className="auth-heading-title m-0 mb-1.5 text-[28px] sm:text-[31px] leading-[1.2] font-bold text-[#182C2A] tracking-[-0.02em] outline-none"
        >
          Chào mừng trở lại!
        </h1>
        <p className="auth-heading-desc m-0 text-[14.5px] leading-[1.55] text-[#5C6E76]">
          Đăng nhập để tiếp tục hành trình cùng SGU Tour.
        </p>
      </header>

      {/* Form-level Error */}
      {error && (
        <div className="mb-4" role="alert" aria-live="assertive">
          <Alert
            message={error}
            type="error"
            showIcon
            className="!rounded-[10px] !py-2 text-[13.5px]"
          />
        </div>
      )}

      {/* Login Form */}
      <div className="auth-stagger-3">
        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
          validateTrigger="onBlur"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ email' },
              { type: 'email', max: 254, message: 'Nhập email hợp lệ, tối đa 254 ký tự' },
            ]}
            className="!mb-3.5"
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              prefix={<Mail size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
              placeholder="ten@email.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            className="!mb-5"
          >
            <Input.Password
              autoComplete="current-password"
              prefix={<Lock size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
              placeholder="Nhập mật khẩu của bạn"
              iconRender={(visible) => (
                <span
                  aria-label={visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  className="inline-flex items-center text-[#5C6E76] hover:text-[#20786D] transition-colors"
                >
                  {visible ? <EyeOff size={17} strokeWidth={1.85} /> : <Eye size={17} strokeWidth={1.85} />}
                </span>
              )}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            disabled={loading}
            className="auth-primary-btn"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Form>
      </div>

      {/* Google OAuth + Unified Navigation */}
      <div className="auth-stagger-4">
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <Divider plain className="!my-4 !text-[13px] !text-[#5C6E76]">
              hoặc tiếp tục với
            </Divider>
            <Suspense fallback={<div className="h-[44px] flex items-center justify-center text-[13px] text-[#5C6E76]">Đang tải Google...</div>}>
              <GoogleSignIn onSuccess={handleGGLogin} />
            </Suspense>
          </>
        )}

        <footer className="auth-footer-nav mt-5 pt-4 border-t border-[#D7E2DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[14px]">
          <p className="m-0 text-[#5C6E76]">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="auth-link-primary">
              Đăng ký ngay
            </Link>
          </p>
          <Link to="/" className="auth-link-back">
            <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
            <span>Về trang chủ</span>
          </Link>
        </footer>
      </div>
    </section>
  );
}

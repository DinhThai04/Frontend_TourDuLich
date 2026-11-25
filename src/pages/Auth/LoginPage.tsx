import { lazy, Suspense } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, loginUserWithGG, refreshCurrentUser } from '@/store/slices/authSlice';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Divider, Alert } from 'antd';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import brand from '@/assets/branding/sgu-tour.svg';
import type { CredentialResponse as GoogleCredentialResponse } from '@react-oauth/google';
import type { RootState } from '@/store';
import { ADMIN_ACCESS, hasPermission } from '@/config/access';

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
  const { loading, error, isAuth, user } = useAppSelector((state: RootState) => state.auth);
  const returnPath = safeReturnPath(location.state)
    ?? safeReturnPath({ from: new URLSearchParams(location.search).get('return') });

  const onFinish = async (values: { email: string; password: string }) => {
    if (loading) return;
    try {
      const res = await dispatch(loginUser(values)).unwrap();
      if (res.code === 1000) {
        message.success('Đăng nhập thành công!', 3);
        await dispatch(refreshCurrentUser()).unwrap().catch(() => undefined);
        navigate(returnPath ?? (hasPermission(res.result.user, ADMIN_ACCESS) ? '/admin' : '/'));
      } else message.error('Đăng nhập thất bại!', 3);
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
        await dispatch(refreshCurrentUser()).unwrap().catch(() => undefined);
        navigate(returnPath ?? (hasPermission(res.result.user, ADMIN_ACCESS) ? '/admin' : '/'));
      } else {
        message.error('Đăng nhập thất bại!', 3);
      }
    } catch {
      // Thông báo lỗi đã được authSlice cập nhật.
    }
  };

  if (isAuth) {
    return <Navigate to={returnPath ?? (hasPermission(user, ADMIN_ACCESS) ? '/admin' : '/')} replace />;
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-6"
      style={{ background: 'linear-gradient(135deg, #F3F8F6 0%, #F8FAFA 55%, #E6F4F1 100%)' }}
    >
      <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_16px_40px_rgba(19,78,72,0.10)] px-7 py-6">
        <Link to="/" aria-label="Trang chủ SGU Tour" className="block w-[184px] mx-auto mb-3">
          <img src={brand} alt="SGU Tour — Hành trình bắt đầu từ đây" className="block w-full h-auto" />
        </Link>

        <div className="text-center mb-4">
          <h1 className="m-0 text-[22px] font-bold text-[#134E48] leading-tight">Đăng nhập</h1>
          <p className="m-0 mt-1 text-[13px] text-[#6B7280]">Chào mừng bạn quay lại với SGU Tour</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="!mb-3.5 !py-2 !rounded-[10px] text-[13px]"
          />
        )}

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="email"
            label={<span className="text-[13px] font-medium text-[#1F2937]">Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
            className="!mb-3"
          >
            <Input
              prefix={<UserOutlined className="text-[#6B7280]" />}
              placeholder="Nhập email của bạn"
              className="!h-[40px] !rounded-[10px]"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-[13px] font-medium text-[#1F2937]">Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            className="!mb-4"
          >
            <Input.Password
              prefix={<LockOutlined className="text-[#6B7280]" />}
              placeholder="Nhập mật khẩu"
              className="!h-[40px] !rounded-[10px]"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full !h-[42px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258] !font-semibold !text-[15px]"
          >
            Đăng nhập
          </Button>
        </Form>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <Divider plain className="!my-3.5 !text-[12px] !text-[#6B7280]">hoặc</Divider>
            <div className="flex w-full justify-center">
              <Suspense fallback={null}>
                <GoogleSignIn onSuccess={handleGGLogin} />
              </Suspense>
            </div>
          </>
        )}

        <div className="mt-4 pt-3.5 border-t border-[#E5E7EB] flex items-center justify-between text-[13px]">
          <span className="text-[#6B7280]">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-[#1F7A6E] no-underline hover:underline">
              Đăng ký ngay
            </Link>
          </span>
          <Link to="/" className="font-medium text-[#6B7280] no-underline hover:text-[#1F7A6E]">
            ← Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

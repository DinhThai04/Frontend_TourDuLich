import { lazy, Suspense } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, loginUserWithGG, refreshCurrentUser } from '@/store/slices/authSlice';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Card, Typography, message, Divider, Space, Alert } from 'antd';
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
    // An expired session leaves through a hard redirect, which cannot carry router state.
    ?? safeReturnPath({ from: new URLSearchParams(location.search).get('return') });

  const onFinish = async (values: { email: string; password: string }) => {
    // Enter in a field and the button both submit; a second login attempt is never wanted.
    if (loading) return;
    try {
      const res = await dispatch(loginUser(values)).unwrap();
      if (res.code === 1000) {
        message.success('Đăng nhập thành công!', 3);
        // Revalidate role/permissions before the guards evaluate the destination.
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
    <>
      <div className="flex justify-center items-center flex-col min-h-[100vh] bg-[#f5f5f5]">
        <Card className="w-[450px] shadow-2xl" style={{ maxWidth: 'calc(100vw - 32px)' }}>
          <Link to="/" aria-label="Trang chủ SGU Tour" style={{ display: 'block', maxWidth: 280, margin: '0 auto 20px' }}>
            <img src={brand} alt="SGU Tour — Hành trình bắt đầu từ đây" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </Link>
          <Typography.Title level={3} className="text-center !text-[#7BBCB0]">
            Đăng nhập
          </Typography.Title>

          {error && <Alert message={error} type="error" showIcon className="!mb-[16px]" />}

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Nhập email!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full !mb-[8px] !bg-[#7BBCB0]"
                loading={loading}
              >
                Đăng nhập
              </Button>

              <Divider plain>hoặc</Divider>

              <Space direction="vertical" className="w-full">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && <Suspense fallback={null}>
                  <GoogleSignIn onSuccess={handleGGLogin} />
                </Suspense>}
              </Space>

              <Typography.Paragraph className="text-center !mb-0">
                Chưa có tài khoản?{' '}
                <Button
                  type="link"
                  onClick={() => navigate('/register')}
                  className="!p-0 !text-[#7BBCB0]"
                >
                  Đăng kí ngay
                </Button>
              </Typography.Paragraph>
              <Button
                type="link"
                onClick={() => navigate('/')}
                className="w-full text-center !my-0 !mx-auto !text-[#7BBCB0]"
              >
                Về trang chủ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

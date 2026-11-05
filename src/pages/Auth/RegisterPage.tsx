import { useState } from 'react';
import { registerService } from '@/services/authServices';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Card, Typography, Checkbox, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import brand from '@/assets/branding/sgu-tour.svg';

type ValuesRegister = {
  username: string;
  address: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const onFinish = async (values: ValuesRegister) => {
    if (loading) return;
    setLoading(true);
    try {
      await registerService({
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        password: values.password,
      });
      message.success('Đăng ký thành công');
      navigate('/login');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f5f5f5',
        }}
      >
        <Card style={{ width: 520, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <Link to="/" aria-label="Trang chủ SGU Tour" style={{ display: 'block', maxWidth: 280, margin: '0 auto 20px' }}>
            <img src={brand} alt="SGU Tour — Hành trình bắt đầu từ đây" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </Link>
          <Typography.Title level={3} style={{ textAlign: 'center' }}>
            Đăng ký hội viên
          </Typography.Title>

          <Form name="register_form" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              label="Tên tài khoản"
              rules={[{ required: true, whitespace: true, message: 'Nhập tên tài khoản!' },
                { min: 3, max: 50, message: 'Tên tài khoản phải từ 3 đến 50 ký tự' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập tên tài khoản" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
                { max: 255, message: 'Email không được quá 255 ký tự' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Nhập số điện thoại!' },
                { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ!' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ required: true, whitespace: true, message: 'Nhập địa chỉ!' },
                { max: 255, message: 'Địa chỉ không được quá 255 ký tự' }]}
            >
              <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, whitespace: true, message: 'Nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                {
                  // BCrypt only reads the first 72 bytes; longer input would be silently truncated.
                  validator: (_, value?: string) => {
                    if (!value) return Promise.resolve();
                    return new TextEncoder().encode(value).length <= 72
                      ? Promise.resolve()
                      : Promise.reject(new Error('Mật khẩu không được quá 72 byte (ký tự có dấu chiếm nhiều byte hơn)'));
                  },
                }]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Nhập lại mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error('Bạn cần đồng ý điều khoản')),
                },
              ]}
            >
              <Checkbox>
                Tôi đã đọc và đồng ý với{' '}
                <a href="/policies" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#7BBCB0' }}>
                  Điều khoản đăng ký hội viên
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                className="!bg-[#7BBCB0]"
                htmlType="submit"
                loading={loading}
                disabled={loading}
                style={{ width: '100%', marginBottom: 8 }}
              >
                Đăng ký
              </Button>
              <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
                Đã có tài khoản?
                <Button
                  type="link"
                  onClick={() => navigate('/login')}
                  style={{ padding: 0, color: '#7BBCB0' }}
                >
                  Đăng nhập ngay
                </Button>
              </Typography.Paragraph>
              <Button className="text-[#7BBCB0]!" block type="link" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

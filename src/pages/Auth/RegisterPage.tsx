import SubNavbar from '@/components/Share/SubNavbar';
import { registerService } from '@/services/authServices';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Card, Typography, Checkbox, message } from 'antd';
import { useNavigate } from 'react-router-dom';

type ValuesRegister = {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  roleId: number;
  confirmPassword: string;
  agreement: boolean;
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const onFinish = async (values: ValuesRegister) => {
    const data = {
      username: values.email,
      password: values.password,
      email: values.email,
      firstName: values.fullname,
      lastName: values.fullname,
      roleId: 4,
      dob: '',
      city: '',
    };
    const res = await registerService(data);

    if (res.code === 1000) {
      message.success('Đăng kí thành công');
      navigate('/login');
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
        <Card style={{ width: 520, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <Typography.Title level={3} style={{ textAlign: 'center' }}>
            Đăng ký hội viên
          </Typography.Title>

          <Form name="register_form" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="fullname"
              label="Họ tên"
              rules={[{ required: true, message: 'Nhập họ tên!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
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
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Nhập mật khẩu!' }]}
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
                <a href="#" style={{ textDecoration: 'underline', color: '#7BBCB0' }}>
                  Điều khoản đăng ký hội viên
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                className="!bg-[#7BBCB0]"
                htmlType="submit"
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

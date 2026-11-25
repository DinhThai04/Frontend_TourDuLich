import { useState } from 'react';
import { registerService } from '@/services/authServices';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Checkbox, message } from 'antd';
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
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-4"
      style={{ background: 'linear-gradient(135deg, #F3F8F6 0%, #F8FAFA 55%, #E6F4F1 100%)' }}
    >
      <div className="w-full max-w-[680px] bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_16px_40px_rgba(19,78,72,0.10)] px-7 py-5">
        <Link to="/" aria-label="Trang chủ SGU Tour" className="block w-[164px] mx-auto mb-2">
          <img src={brand} alt="SGU Tour — Hành trình bắt đầu từ đây" className="block w-full h-auto" />
        </Link>

        <div className="text-center mb-3.5">
          <h1 className="m-0 text-[21px] font-bold text-[#134E48] leading-tight">Đăng ký hội viên</h1>
          <p className="m-0 mt-0.5 text-[13px] text-[#6B7280]">Tạo tài khoản để đặt tour và theo dõi hành trình dễ dàng</p>
        </div>

        <Form name="register_form" onFinish={onFinish} layout="vertical" requiredMark="optional">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="username"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Tên tài khoản</span>}
              rules={[
                { required: true, whitespace: true, message: 'Nhập tên tài khoản!' },
                { min: 3, max: 50, message: 'Tên tài khoản từ 3 đến 50 ký tự' },
              ]}
              className="!mb-2.5"
            >
              <Input prefix={<UserOutlined className="text-[#6B7280]" />} placeholder="Nhập tên tài khoản" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Email</span>}
              rules={[
                { required: true, message: 'Nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
                { max: 255, message: 'Email không quá 255 ký tự' },
              ]}
              className="!mb-2.5"
            >
              <Input prefix={<MailOutlined className="text-[#6B7280]" />} placeholder="Nhập email" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Số điện thoại</span>}
              rules={[
                { required: true, message: 'Nhập số điện thoại!' },
                { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ!' },
              ]}
              className="!mb-2.5"
            >
              <Input prefix={<PhoneOutlined className="text-[#6B7280]" />} placeholder="Nhập số điện thoại" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>

            <Form.Item
              name="address"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Địa chỉ</span>}
              rules={[
                { required: true, whitespace: true, message: 'Nhập địa chỉ!' },
                { max: 255, message: 'Địa chỉ không quá 255 ký tự' },
              ]}
              className="!mb-2.5"
            >
              <Input placeholder="Nhập địa chỉ" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Mật khẩu</span>}
              rules={[
                { required: true, whitespace: true, message: 'Nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                {
                  validator: (_, value?: string) => {
                    if (!value) return Promise.resolve();
                    return new TextEncoder().encode(value).length <= 72
                      ? Promise.resolve()
                      : Promise.reject(new Error('Mật khẩu không được quá 72 byte'));
                  },
                },
              ]}
              hasFeedback
              className="!mb-2.5"
            >
              <Input.Password prefix={<LockOutlined className="text-[#6B7280]" />} placeholder="Nhập mật khẩu" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-[13px] font-medium text-[#1F2937]">Nhập lại mật khẩu</span>}
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
              className="!mb-2.5"
            >
              <Input.Password prefix={<LockOutlined className="text-[#6B7280]" />} placeholder="Nhập lại mật khẩu" className="!h-[38px] !rounded-[10px]" />
            </Form.Item>
          </div>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý điều khoản')),
              },
            ]}
            className="!mb-3"
          >
            <Checkbox className="text-[13px]">
              Tôi đã đọc và đồng ý với{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[#1F7A6E] underline">
                Điều khoản đăng ký hội viên
              </Link>
            </Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={loading}
            className="w-full !h-[42px] !rounded-[10px] !bg-[#1F7A6E] hover:!bg-[#176258] !font-semibold !text-[15px]"
          >
            Đăng ký
          </Button>
        </Form>

        <div className="mt-3.5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[13px]">
          <span className="text-[#6B7280]">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-[#1F7A6E] no-underline hover:underline">
              Đăng nhập ngay
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

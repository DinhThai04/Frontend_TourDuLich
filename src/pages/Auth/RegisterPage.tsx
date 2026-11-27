import VietnamAddressFields from '@/components/Share/VietnamAddressFields';
import { formatVietnamAddress, validateVietnamAddress, type AddressDraft } from '@/utils/vietnamAddress';
import { contactEmail, personName, strongPassword, vietnamesePhone } from '@/utils/contactValidation';
import { useEffect, useRef, useState } from 'react';
import { registerService } from '@/services/authServices';
import { Alert, Button, Checkbox, Form, Input, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import brand from '@/assets/branding/sgu-tour.svg';
import PasswordStrengthIndicator from '@/components/Auth/PasswordStrengthIndicator';

type ValuesRegister = {
  username: string;
  address: AddressDraft;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const onFinish = async (values: ValuesRegister) => {
    const address = formatVietnamAddress(values.address);
    if (loading || !address) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await registerService({
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address,
        password: values.password,
      });
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Đăng ký thất bại, vui lòng thử lại.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordIcon = (visible: boolean) => (
    <span
      aria-label={visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
      className="inline-flex items-center text-[#5C6E76] hover:text-[#20786D] transition-colors"
    >
      {visible ? <EyeOff size={17} strokeWidth={1.85} /> : <Eye size={17} strokeWidth={1.85} />}
    </span>
  );

  return (
    <section aria-labelledby="register-heading">
      {/* Brand Logo */}
      <div className="auth-stagger-1 auth-brand-wrap mb-3.5">
        <Link to="/" aria-label="Trang chủ SGU Tour" className="auth-brand-logo inline-block w-[150px]">
          <img src={brand} alt="SGU Tour" className="block w-full h-auto" />
        </Link>
      </div>

      {/* Heading */}
      <header className="auth-stagger-2 auth-heading-wrap mb-4">
        <h1
          id="register-heading"
          ref={headingRef}
          tabIndex={-1}
          className="auth-heading-title m-0 mb-1 text-[27px] sm:text-[30px] leading-[1.2] font-bold text-[#182C2A] tracking-[-0.02em] outline-none"
        >
          Tạo tài khoản
        </h1>
        <p className="auth-heading-desc m-0 text-[14.5px] leading-[1.55] text-[#5C6E76]">
          Bắt đầu hành trình khám phá Việt Nam cùng SGU Tour.
        </p>
      </header>

      {/* Form-level Error */}
      {submitError && (
        <div className="mb-3.5" role="alert" aria-live="assertive">
          <Alert
            message={submitError}
            type="error"
            showIcon
            closable
            onClose={() => setSubmitError(null)}
            className="!rounded-[10px] !py-2 text-[13.5px]"
          />
        </div>
      )}

      {/* Register Form (3 clean logical groups, 2-column desktop) */}
      <div className="auth-stagger-3">
        <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          validateTrigger="onBlur"
        >
          {/* Nhóm 1 — Thông tin tài khoản */}
          <div className="auth-group-block mb-1.5">
            <p className="auth-group-title">Thông tin tài khoản</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Form.Item
                name="username"
                label="Tên tài khoản"
                rules={[
                  { required: true, whitespace: true, message: 'Vui lòng nhập tên tài khoản' },
                  { min: 2, max: 50, message: 'Tên tài khoản phải từ 2 đến 50 ký tự' },
                  { pattern: personName, message: 'Tên tài khoản chỉ gồm chữ và khoảng trắng' },
                ]}
                className="!mb-3"
              >
                <Input
                  autoComplete="username"
                  prefix={<User size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
                  placeholder="VD: nguyenvana hoặc Nguyễn Văn A"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Địa chỉ email chưa đúng định dạng' },
                  { max: 254, pattern: contactEmail, message: 'Nhập email có tên miền hợp lệ, tối đa 254 ký tự' },
                ]}
                className="!mb-3"
              >
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  prefix={<Mail size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
                  placeholder="ten@email.com"
                />
              </Form.Item>
            </div>
          </div>

          {/* Nhóm 2 — Thông tin liên hệ */}
          <div className="auth-group-block mb-1.5">
            <p className="auth-group-title">Thông tin liên hệ</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: vietnamesePhone, message: 'Số điện thoại bắt đầu bằng 0 và gồm 10–11 chữ số' },
                ]}
                className="!mb-3"
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  prefix={<Phone size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
                  placeholder="0901234567"
                />
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ" className="!mb-3"
                required rules={[{ validator: validateVietnamAddress }]} validateTrigger="onSubmit">
                <VietnamAddressFields />
              </Form.Item>
            </div>
          </div>

          {/* Nhóm 3 — Bảo mật tài khoản */}
          <div className="auth-group-block mb-1">
            <p className="auth-group-title">Bảo mật tài khoản</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 items-start">
              <div>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, whitespace: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                    { pattern: strongPassword, message: 'Dùng chữ hoa, chữ thường, số và ký tự đặc biệt' },
                    { max: 72, message: 'Mật khẩu không được quá 72 ký tự' },
                    {
                      validator: (_, value?: string) => {
                        if (!value) return Promise.resolve();
                        return new TextEncoder().encode(value).length <= 72
                          ? Promise.resolve()
                          : Promise.reject(new Error('Mật khẩu không được quá 72 byte'));
                      },
                    },
                  ]}
                  className="!mb-1"
                >
                  <Input.Password
                    autoComplete="new-password"
                    onChange={(e) => setPasswordValue(e.target.value)}
                    prefix={<Lock size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
                    placeholder="Từ 8 đến 72 ký tự"
                    iconRender={renderPasswordIcon}
                  />
                </Form.Item>
                <PasswordStrengthIndicator password={passwordValue} />
              </div>

              <Form.Item
                name="confirmPassword"
                label="Nhập lại mật khẩu"
                dependencies={['password']}
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                  { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu nhập lại chưa khớp'));
                    },
                  }),
                ]}
                className="!mb-3"
              >
                <Input.Password
                  autoComplete="new-password"
                  prefix={<Lock size={17} strokeWidth={1.85} className="auth-field-icon" aria-hidden="true" />}
                  placeholder="Nhập lại mật khẩu"
                  iconRender={renderPasswordIcon}
                />
              </Form.Item>
            </div>
          </div>

          {/* Điều khoản */}
          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý với điều khoản đăng ký hội viên')),
              },
            ]}
            className="!mt-1 !mb-4"
          >
            <Checkbox className="text-[13.5px] text-[#182C2A]">
              Tôi đã đọc và đồng ý với{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-link-primary"
              >
                Điều khoản đăng ký hội viên
              </Link>
              .
            </Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            disabled={loading}
            className="auth-primary-btn"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
        </Form>
      </div>

      {/* Unified Navigation */}
      <footer className="auth-stagger-4 auth-footer-nav mt-5 pt-4 border-t border-[#D7E2DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[14px]">
        <p className="m-0 text-[#5C6E76]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link-primary">
            Đăng nhập ngay
          </Link>
        </p>
        <Link to="/" className="auth-link-back">
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>
      </footer>
    </section>
  );
}

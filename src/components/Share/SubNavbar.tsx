import { Dropdown, Button, Typography, message } from 'antd';
import { PhoneOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Container from './Container';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';

export default function TopNavbar() {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const userMenu = (user &&
    user !== null && [
      {
        key: 'profile',
        label: (
          <Button type="link" onClick={() => navigate('/profile')}>
            {user.username}
          </Button>
        ),
      },
      {
        key: 'logout',
        label: (
          <Button
            type="link"
            onClick={() => {
              dispatch(logoutUser());
              message.success('Đăng xuất thành công');
            }}
          >
            Đăng xuất
          </Button>
        ),
      },
    ]) || [
    {
      key: 'login',
      label: (
        <Button type="link" onClick={() => navigate('/login')}>
          Đăng nhập
        </Button>
      ),
    },
    {
      key: 'register',
      label: (
        <Button type="link" onClick={() => navigate('/register')}>
          Đăng kí
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-[#dcefff] !py-[8px]">
      <Container className="flex justify-between items-center">
        <Typography.Paragraph className="text-center !mb-[0px] text-[13px]">
          <PhoneOutlined />
          <a href="tel:0799664334" className="!text-[#e01600] font-[600]">
            {' '}
            0799 664 334
          </a>{' '}
          - Daily: 8:00 AM - 11:00 PM
        </Typography.Paragraph>
        <div className="flex items-center justify-center gap-[12px]">
          {/* <div
            className="h-full flex items-center gap-[10px] px-[6px] py-[2px] rounded-[4px] cursor-pointer hover:bg-[#f0f0f0]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <img src={flag} alt="VN" className="w-[20px] h-[20px] object-cover" />
            <span className="text-[13px]/[1] font-[700]">VNĐ</span>
          </div> */}
          <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
            {user != null && user.username ? (
              <SettingOutlined className="text-[20px] text-black cursor-pointer" />
            ) : (
              // <UserOutlined className="text-[20px] text-black cursor-pointer" />
              <span className="text-[14px] text-[#2163ae] font-[700] cursor-pointer">
                Đăng nhập / Đăng kí
              </span>
            )}
          </Dropdown>
        </div>
        {/* <ModalChangeLC isOpen={isOpen} setIsOpen={setIsOpen} /> */}
      </Container>
    </div>
  );
}

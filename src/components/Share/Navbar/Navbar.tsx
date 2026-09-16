import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, message } from 'antd';
import brand from '@/assets/images/logo.png';
import Container from '@/components/Share/Container';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import fallback from '@/assets/images/fallback.png';

const Navbar: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userMenu = (user &&
    [
      {
        key: 'profile',
        label: (
          <Button type="link" onClick={() => navigate('/profile')}>
            Trang cá nhân
          </Button>
        ),
      },

      // Chỉ hiển thị nếu KHÔNG phải khách hàng
      user.role?.name !== 'Khách Hàng' && {
        key: 'admin',
        label: (
          <Button type="link" onClick={() => navigate('/admin')}>
            Trang quản trị
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
    ].filter(Boolean)) || [
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
    <div className="bg-white shadow-sm">
      <Container className="flex items-center justify-between relative py-[10px]">
        {/* Logo */}
        <div className="flex-1 flex items-center !py-2">
          <Link to="/" className=" h-[60px] flex items-center">
            <img src={brand} alt="brand" className="w-full h-full object-contain" />
          </Link>
        </div>

        {/* Menu chính */}
        <div className="flex-1 flex items-center justify-end gap-5">
          {/* <Menu
            mode="horizontal"
            selectable={false}
            className="flex-1 border-none h-[60px] flex items-center"
            items={[
              {
                key: 'tours',
                label: (
                  <Link
                    to="/tours"
                    className="text-black text-[16px] font-[700] text-base hover:text-blue-500 transition"
                  >
                    Chuyến đi
                  </Link>
                ),
              },
              {
                key: 'rating',
                label: (
                  <Link
                    to="/rating"
                    className="text-black text-[16px] font-[700] text-base hover:text-blue-500 transition"
                  >
                    Đánh giá
                  </Link>
                ),
              },
              {
                key: 'promotion',
                label: (
                  <Link
                    to="/promotion"
                    className="text-black text-[16px] font-[700] text-base hover:text-blue-500 transition"
                  >
                    Ưu đãi
                  </Link>
                ),
              },
            ]}
          /> */}

          <div className="flex items-center justify-center gap-[12px]">
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
              {user != null && user.username ? (
                <Avatar
                  size={40}
                  src={user?.avatar || fallback}
                  className="border-2 border-gray-200 cursor-pointer"
                />
              ) : (
                // <UserOutlined className="text-[20px] text-black cursor-pointer" />
                <button className=" bg-[#7BBCB0] rounded-[6px] !px-2 !py-2 transition hover:bg-[#87b0eb]">
                  <span className=" text-[14px] text-white font-[700] cursor-pointer">
                    Đăng nhập / Đăng kí
                  </span>
                </button>
              )}
            </Dropdown>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;

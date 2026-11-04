import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, message } from 'antd';
import brand from '@/assets/branding/sgu-tour-header.svg';
import Container from '@/components/Share/Container';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import fallback from '@/assets/images/fallback.png';
import { ADMIN_ACCESS, hasPermission } from '@/config/access';

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

      // Hiển thị theo quyền truy cập quản trị gắn với vai trò trong database.
      hasPermission(user, ADMIN_ACCESS) && {
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
            onClick={async () => {
              const result = await dispatch(logoutUser());
              // The local session is always cleared; only a failed server revocation may keep a refresh token alive.
              if (logoutUser.rejected.match(result)) message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này; máy chủ chưa phản hồi.');
              else message.success('Đăng xuất thành công');
            }}
          >
            Đăng xuất
          </Button>
        ),
      },
    ].filter((item): item is Exclude<typeof item, false> => Boolean(item))) || [
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
          <Link to="/" aria-label="Trang chủ SGU Tour" className="flex h-[60px] w-[160px] shrink-0 items-center sm:w-[200px]">
            <img src={brand} alt="SGU Tour" className="block h-auto w-full object-contain" />
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
            <Link to="/policies" className="hidden min-[480px]:inline text-sm text-[#21776d] font-semibold">Chính sách</Link>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow trigger={['hover', 'click']}>
              {user != null && user.username ? (
                <button
                  type="button"
                  aria-label="Mở menu tài khoản"
                  className="rounded-full border-0 bg-transparent p-0 cursor-pointer"
                >
                  <Avatar
                    size={40}
                    src={user?.avatar || fallback}
                    className="border-2 border-gray-200"
                  />
                </button>
              ) : (
                // A real link keeps click, Enter/Space and middle-click navigation working.
                <Link
                  to="/login"
                  aria-label="Đăng nhập hoặc đăng kí"
                  className="inline-block bg-[#7BBCB0] rounded-[6px] !px-2 !py-2 transition hover:bg-[#87b0eb]"
                >
                  <span className=" text-[14px] text-white font-[700]">
                    Đăng nhập / Đăng kí
                  </span>
                </Link>
              )}
            </Dropdown>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;

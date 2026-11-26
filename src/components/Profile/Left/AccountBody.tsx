import { CustomerServiceOutlined, FileTextOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';

type ProfileTab = 'info' | 'bookings' | 'support';

interface IProps {
  activeMenu: ProfileTab;
  setActiveMenu: (val: ProfileTab) => void;
}

const AccountBody = ({ activeMenu, setActiveMenu }: IProps) => {
  const dispatch = useAppDispatch();

  const items: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Thông tin tài khoản', icon: <UserOutlined /> },
    { key: 'bookings', label: 'Đơn đặt chỗ', icon: <FileTextOutlined /> },
    { key: 'support', label: 'Yêu cầu hỗ trợ', icon: <CustomerServiceOutlined /> },
  ];

  const handleLogout = async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.rejected.match(result)) {
      message.warning(result.payload ?? 'Đã xóa phiên trên thiết bị này.');
    } else {
      message.success('Đăng xuất thành công');
    }
  };

  return (
    <nav
      aria-label="Điều hướng tài khoản"
      className="rounded-[16px] border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.06)]"
    >
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const active = activeMenu === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMenu(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[44px] w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 px-3.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A6E] ${
                active
                  ? 'bg-[#E6F4F1] font-semibold text-[#134E48]'
                  : 'bg-transparent font-medium text-[#1F2937] hover:bg-[#F3F4F6]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-2 border-t border-[#E5E7EB]" />

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex h-[44px] w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3.5 text-left text-sm font-medium text-[#991B1B] transition-colors hover:bg-[#FEE2E2]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A6E]"
        >
          <LogoutOutlined className="text-base" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
};

export default AccountBody;

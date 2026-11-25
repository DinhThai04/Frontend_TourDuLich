import { FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { Card } from 'antd';

interface IProps {
  activeMenu: string;
  setActiveMenu: (val: string) => void;
}

const AccountBody = ({ activeMenu, setActiveMenu }: IProps) => {
  return (
    <Card className="border border-[#e5ece9] shadow-xs rounded-xl">
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setActiveMenu('info')}
          aria-pressed={activeMenu === 'info'}
          className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
            activeMenu === 'info' ? 'bg-[#eaf3f0] text-[#155e54] font-medium' : 'text-[#314a44] hover:bg-[#f3f7f5]'
          }`}
        >
          <UserOutlined />
          <span>Thông tin tài khoản</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMenu('bookings')}
          aria-pressed={activeMenu === 'bookings'}
          className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
            activeMenu === 'bookings' ? 'bg-[#eaf3f0] text-[#155e54] font-medium' : 'text-[#314a44] hover:bg-[#f3f7f5]'
          }`}
        >
          <FileTextOutlined />
          <span>Đơn đặt chỗ</span>
        </button>
      </div>
    </Card>
  );
};

export default AccountBody;

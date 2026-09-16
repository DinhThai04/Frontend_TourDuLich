import { FileTextOutlined, UserOutlined } from '@ant-design/icons';
import { Card } from 'antd';

interface IProps {
  activeMenu: string;
  setActiveMenu: (val: string) => void;
}

const AccountBody = ({ activeMenu, setActiveMenu }: IProps) => {
  return (
    <Card className="shadow-md rounded-2xl">
      <div className="!space-y-3">
        <div
          onClick={() => setActiveMenu('info')}
          className={`w-full text-left !px-3 !py-2 rounded-lg transition cursor-pointer ${
            activeMenu === 'info' ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-200'
          }`}
        >
          <UserOutlined className="!mr-2" />
          Thông tin tài khoản
        </div>
        <div
          onClick={() => setActiveMenu('bookings')}
          className={`!w-full text-left !px-3 !py-2 !rounded-lg !transition cursor-pointer ${
            activeMenu === 'bookings' ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-200'
          }`}
        >
          <FileTextOutlined className="!mr-2" />
          Đơn đặt chỗ
        </div>
        {/* <div
          onClick={() => setActiveMenu('reviews')}
          className={`!w-full text-left !px-3 !py-2 !rounded-lg !transition cursor-pointer ${
            activeMenu === 'reviews' ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-200'
          }`}
        >
          <UserOutlined className="!mr-2" />
          Đánh giá của quý khách
        </div> */}
      </div>
    </Card>
  );
};

export default AccountBody;

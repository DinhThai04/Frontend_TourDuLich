import { Card } from 'antd';
import Info from './Info';
import History from './History';

interface IProps {
  activeMenu: string;
}

const AccountContent = ({ activeMenu }: IProps) => {
  const renderRightContent = () => {
    switch (activeMenu) {
      case 'info':
        return <Info />;
      case 'bookings':
        return <History />;
      case 'favorites':
      // return <Liked />;
      case 'reviews':
      // return <Rate />;
      default:
        return <p>Không có dữ liệu !!!</p>;
    }
  };

  return <Card className="!p-2 !shadow-md !rounded-2xl">{renderRightContent()}</Card>;
};

export default AccountContent;

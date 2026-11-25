import Info from './Info';
import History from './History';
import BookingChangesPanel from './BookingChangesPanel';

type ProfileTab = 'info' | 'bookings' | 'support';

interface IProps {
  activeMenu: ProfileTab;
  onOpenSupport?: () => void;
}

const AccountContent = ({ activeMenu, onOpenSupport }: IProps) => {
  switch (activeMenu) {
    case 'info':
      return <Info />;
    case 'bookings':
      return <History onOpenSupport={onOpenSupport} />;
    case 'support':
      return <BookingChangesPanel onChanged={() => {}} onClearBooking={() => {}} />;
    default:
      return <Info />;
  }
};

export default AccountContent;

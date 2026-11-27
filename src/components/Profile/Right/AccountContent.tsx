import Info from './Info';
import History from './History';
import BookingChangesPanel from './BookingChangesPanel';

type ProfileTab = 'info' | 'bookings' | 'support';

interface IProps {
  activeMenu: ProfileTab;
  onOpenSupport?: (bookingId?: number) => void;
  supportBookingId?: number;
}

const AccountContent = ({ activeMenu, onOpenSupport, supportBookingId }: IProps) => {
  switch (activeMenu) {
    case 'info':
      return <Info />;
    case 'bookings':
      return <History onOpenSupport={onOpenSupport} />;
    case 'support':
      return <BookingChangesPanel initialBookingId={supportBookingId} />;
    default:
      return <Info />;
  }
};

export default AccountContent;

import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Container from '@/components/Share/Container';
import AccountTop from '@/components/Profile/Left/AccountTop';
import AccountBody from '@/components/Profile/Left/AccountBody';
import AccountContent from '@/components/Profile/Right/AccountContent';

const ProfilePage = () => {
  const { hash } = useLocation();
  const [activeMenu, setActiveMenu] = useState(hash === '#don-dat-tour' ? 'bookings' : 'info');
  useEffect(() => { setActiveMenu(hash === '#don-dat-tour' ? 'bookings' : 'info'); }, [hash]);

  return (
    <div className="bg-gray-50 !min-h-screen !py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-6">
          <div className="min-w-0 flex flex-col gap-6">
            <AccountTop />
            <AccountBody activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          </div>
          <div className="min-w-0">
            <AccountContent activeMenu={activeMenu} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

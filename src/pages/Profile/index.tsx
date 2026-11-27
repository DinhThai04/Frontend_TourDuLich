import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Container from '@/components/Share/Container';
import AccountTop from '@/components/Profile/Left/AccountTop';
import AccountBody from '@/components/Profile/Left/AccountBody';
import AccountContent from '@/components/Profile/Right/AccountContent';

type ProfileTab = 'info' | 'bookings' | 'support';

function tabFromHash(hash: string): ProfileTab {
  if (hash === '#don-dat-tour') return 'bookings';
  if (hash === '#yeu-cau-ho-tro') return 'support';
  return 'info';
}

const ProfilePage = () => {
  const { hash, search } = useLocation();
  const supportBookingId = Number(new URLSearchParams(search).get('bookingId'));
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<ProfileTab>(() => tabFromHash(hash));

  useEffect(() => {
    setActiveMenu(tabFromHash(hash));
  }, [hash]);

  const handleSelectMenu = (tab: ProfileTab, bookingId?: number) => {
    setActiveMenu(tab);
    const nextHash = tab === 'bookings' ? '#don-dat-tour' : tab === 'support' ? '#yeu-cau-ho-tro' : '';
    navigate({ pathname: '/profile', hash: nextHash, search: bookingId ? `?bookingId=${bookingId}` : '' }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFA] py-8 md:py-10">
      <Container>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="min-w-0 flex flex-col gap-6">
            <AccountTop />
            <AccountBody activeMenu={activeMenu} setActiveMenu={handleSelectMenu} />
          </aside>
          <section className="min-w-0">
            <AccountContent activeMenu={activeMenu} supportBookingId={supportBookingId || undefined} onOpenSupport={(id) => handleSelectMenu('support', id)} />
          </section>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

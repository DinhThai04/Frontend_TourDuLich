import { useState } from 'react';
import Container from '@/components/Share/Container';
import AccountTop from '@/components/Profile/Left/AccountTop';
import AccountBody from '@/components/Profile/Left/AccountBody';
import AccountContent from '@/components/Profile/Right/AccountContent';

const ProfilePage = () => {
  const [activeMenu, setActiveMenu] = useState('info');

  return (
    <div className="bg-gray-50 !min-h-screen !py-16">
      <Container>
        <div className="flex gap-6">
          <div className="w-[20%] flex flex-col gap-6">
            <AccountTop />
            <AccountBody activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          </div>
          <div className="!w-[80%]">
            <AccountContent activeMenu={activeMenu} />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

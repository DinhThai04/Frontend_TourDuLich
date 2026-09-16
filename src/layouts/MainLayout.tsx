import Navbar from '@/components/Share/Navbar/Navbar';
import { Outlet } from 'react-router-dom';
import { Footer as MyFooter } from '@/components/Share/Footer';

export default function MainLayout() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <MyFooter />
      </footer>
    </>
  );
}

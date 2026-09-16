import { Route, BrowserRouter, Routes } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import Home from '@pages/Home/page';
import About from '@pages/About';
import NotFound from '@pages/NotFound';
import ProfilePage from '@/pages/Profile';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import Tours from '@/pages/Tours/page';
import RouteGuard from './RouteGuard';
import LayoutAdmin from '../pages/Admin/LayoutAdmin';
import ManagerUser from '../components/Admin/ManagerUser/ManagerUser';
import ManagerTour from '../components/Admin/ManagerTour/ManagerTour';
import ManagerBooking from '../components/Admin/ManagerBooking/ManagerBooking';
import ManagerPromotion from '../components/Admin/ManagerPomt/ManagerPomt';
import ManagerSchedule from '../components/Admin/ManagerTour/ManagerSchedule';
import ManagerDestination from '../components/Admin/ManagerTour/ManagerLocation';
import TourDetail from '@/layouts/TourDetail';
import Booking from '@/pages/Booking/BookingPage';
import Invoice from '@/pages/Invoice/InvoicePage';
import MoMoQRPage from '@/pages/Payment/MoMoQRPage';
import ManagerInvoice from '@/components/Admin/ManagerInvoice/ManagerInvoice';
import ManagerReViewTour from '@/components/Admin/ManagerTour/ManagerReViewTour';
import ManagerRole from '@/components/Admin/ManagerTour/ManagerRole';
import ManagerRoleUser from '@/components/Admin/ManagerRoleUser/ManagerRoleUser';
import VnPayCallback from '@/pages/Payment/VnPayCallback';
import ManagerTourDeparture from '@/components/Admin/ManagerTour/ManagerTourDeparture';
import ManagerPrice from '@/components/Admin/ManagerTour/ManagerPrice';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="/tours/*" element={<Tours />} />

          <Route path="/booking" element={<Booking />} />
          <Route path="/invoice/booking/:id" element={<Invoice />} />
          <Route path="/payment/momo" element={<MoMoQRPage />} />
          <Route path="/payment/vnpay/callback" element={<VnPayCallback />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/detail/:id" element={<TourDetail />} />
          <Route element={<RouteGuard isPrivate />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<RouteGuard isPrivate={false} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
        <Route
          element={
            <RouteGuard isPrivate roles={['Quản trị viên Tour', 'Nhân Viên']} redirectPath="/" />
          }
        >
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route path="/admin/managerUser" element={<ManagerUser />} />
            <Route path="/admin/managerTour/list" element={<ManagerTour />} />
            <Route path="/admin/managerBooking" element={<ManagerBooking />} />
            <Route path="/admin/managerPromotion" element={<ManagerPromotion />} />
            <Route path="/admin/managerTour/itinerary" element={<ManagerSchedule />} />
            <Route path="/admin/managerTour/destination" element={<ManagerDestination />} />
            <Route path="/admin/managerTour/tourDeparture" element={<ManagerTourDeparture />} />
            <Route path="/admin/managerTour/price" element={<ManagerPrice />} />
            <Route path="/admin/managerTour/reviews" element={<ManagerReViewTour />} />
            <Route path="/admin/role" element={<ManagerRole />} />
            <Route path="/admin/managerRole" element={<ManagerRoleUser />} />
            <Route path="/admin/managerInvoice" element={<ManagerInvoice />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

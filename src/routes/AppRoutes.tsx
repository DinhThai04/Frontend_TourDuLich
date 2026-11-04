import { lazy, Suspense } from 'react';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import Home from '@pages/Home/page';
const About = lazy(() => import('@pages/About'));
import NotFound from '@pages/NotFound';
const ProfilePage = lazy(() => import('@/pages/Profile'));
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const Tours = lazy(() => import('@/pages/Tours/page'));
import RouteGuard from './RouteGuard';
import { ADMIN_ACCESS } from '@/config/access';
import PermissionGate from './PermissionGate';
import { ALL_PERMISSIONS as P } from '@/config/permissions';
const LayoutAdmin = lazy(() => import('../pages/Admin/LayoutAdmin'));
const AdminLanding = lazy(() => import('@/pages/Admin/AdminLanding'));
const ManagerUser = lazy(() => import('../components/Admin/ManagerUser/ManagerUser'));
const ManagerTour = lazy(() => import('../components/Admin/ManagerTour/ManagerTour'));
const ManagerBooking = lazy(() => import('../components/Admin/ManagerBooking/ManagerBooking'));
const ManagerPromotion = lazy(() => import('../components/Admin/ManagerPomt/ManagerPomt'));
const ManagerSchedule = lazy(() => import('../components/Admin/ManagerTour/ManagerSchedule'));
const ManagerDestination = lazy(() => import('../components/Admin/ManagerTour/ManagerLocation'));
const TourDetail = lazy(() => import('@/layouts/TourDetail'));
const Booking = lazy(() => import('@/pages/Booking/BookingPage'));
const Invoice = lazy(() => import('@/pages/Invoice/InvoicePage'));
const ManagerInvoice = lazy(() => import('@/components/Admin/ManagerInvoice/ManagerInvoice'));
const ManagerReViewTour = lazy(() => import('@/components/Admin/ManagerTour/ManagerReViewTour'));
const ManagerRole = lazy(() => import('@/components/Admin/ManagerTour/ManagerRole'));
const ManagerRoleUser = lazy(() => import('@/components/Admin/ManagerRoleUser/ManagerRoleUser'));
const VnPayCallback = lazy(() => import('@/pages/Payment/VnPayCallback'));
const ManagerTourDeparture = lazy(() => import('@/components/Admin/ManagerTour/ManagerTourDeparture'));
const ManagerPrice = lazy(() => import('@/components/Admin/ManagerTour/ManagerPrice'));
const PaymentReconciliation = lazy(() => import('@/pages/Admin/PaymentReconciliation'));
import ScrollToTop from './ScrollToTop';
import { AiConversationProvider } from '@/components/AI/AiConversationProvider';
const PoliciesPage = lazy(() => import('@/pages/Policies/PoliciesPage'));

export default function AppRoutes() {
  return (
      <BrowserRouter>
        <ScrollToTop />
        <AiConversationProvider>
        <Suspense fallback={<div role="status" style={{ padding: 32 }}>Đang tải trang…</div>}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/tours/*" element={<Tours />} />

            <Route element={<RouteGuard isPrivate />}>
              <Route path="/booking" element={<Booking />} />
              <Route path="/invoice/booking/:id" element={<Invoice />} />
            </Route>
            <Route path="/payment/vnpay/callback" element={<VnPayCallback />} />
            <Route path="/tours/detail/:id" element={<TourDetail />} />
            <Route element={<RouteGuard isPrivate />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            {/* 404 nằm trong MainLayout để vẫn có header/footer khi sai đường dẫn. */}
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<RouteGuard isPrivate={false} />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route
              element={
                <RouteGuard
                    isPrivate
                    requiredPermission={ADMIN_ACCESS}
                    redirectPath="/"
                />
              }
          >
            <Route path="/admin" element={<LayoutAdmin />}>
              <Route index element={<AdminLanding />} />
              <Route path="/admin/paymentReconciliation" element={<PermissionGate permission={P.PAYMENT_RECONCILIATION.GET_LIST}><PaymentReconciliation /></PermissionGate>} />
              <Route path="/admin/managerUser" element={<PermissionGate permission={P.USERS.GET_LIST}><ManagerUser /></PermissionGate>} />
              <Route path="/admin/managerTour/list" element={<PermissionGate permission={P.TOURS.GET_LIST}><ManagerTour /></PermissionGate>} />
              <Route path="/admin/managerBooking" element={<PermissionGate permission={P.BOOKINGS.GET_ALL}><ManagerBooking /></PermissionGate>} />
              {/* Khuyến mãi chưa có module riêng; tạm dùng quyền quản lý catalogue để không mở cho mọi tài khoản. */}
              <Route path="/admin/managerPromotion" element={<PermissionGate permission={P.TOURS.GET_LIST}><ManagerPromotion /></PermissionGate>} />
              <Route path="/admin/managerTour/itinerary" element={<PermissionGate permission={P.ITINERARIES.GET_BY_TOUR}><ManagerSchedule /></PermissionGate>} />
              <Route path="/admin/managerTour/destination" element={<PermissionGate permission={P.LOCATIONS.GET_DESTINATIONS}><ManagerDestination /></PermissionGate>} />
              <Route path="/admin/managerTour/tourDeparture" element={<PermissionGate permission={P.TOUR_DEPARTURES.GET_LIST}><ManagerTourDeparture /></PermissionGate>} />
              <Route path="/admin/managerTour/price" element={<PermissionGate permission={P.PRICE.GET_LIST}><ManagerPrice /></PermissionGate>} />
              <Route path="/admin/managerTour/reviews" element={<PermissionGate permission={P.REVIEWS.GET_LIST}><ManagerReViewTour /></PermissionGate>} />
              <Route path="/admin/role" element={<PermissionGate permission={P.ROLES.GET_LIST}><ManagerRole /></PermissionGate>} />
              <Route path="/admin/managerRole" element={<PermissionGate permission={P.PERMISSIONS.GET_LIST}><ManagerRoleUser /></PermissionGate>} />
              <Route path="/admin/managerInvoice" element={<PermissionGate permission={P.INVOICES.GET_ALL}><ManagerInvoice /></PermissionGate>} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
        </AiConversationProvider>
      </BrowserRouter>
  );
}

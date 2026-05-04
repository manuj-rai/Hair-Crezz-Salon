import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminBookings from './pages/admin/AdminBookings';
import AdminServices from './pages/admin/AdminServices';
import AdminStylists from './pages/admin/AdminStylists';
import AdminHours from './pages/admin/AdminHours';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';
import RequireAuth from './pages/admin/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="stylists" element={<AdminStylists />} />
        <Route path="hours" element={<AdminHours />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

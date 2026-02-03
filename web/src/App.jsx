import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Layout
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import ParkingDetailsPage from "./pages/ParkingDetailsPage";

// Protected Pages
import BookingPage from "./pages/BookingPage";
import BookingsPage from "./pages/BookingsPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";

// Owner Pages
import OwnerDashboardPage from "./pages/owner/DashboardPage";
import AddListingPage from "./pages/owner/AddListingPage";
import MyListingsPage from "./pages/owner/MyListingsPage";
import EditListingPage from "./pages/owner/EditListingPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminListingsPage from "./pages/admin/ListingsPage";
import AdminBookingsPage from "./pages/admin/BookingsPage";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="parking/:id" element={<ParkingDetailsPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="booking/:id" element={<BookingPage />} />
              <Route
                path="booking/confirmation/:id"
                element={<BookingConfirmationPage />}
              />
              <Route path="bookings" element={<BookingsPage />} />
              <Route
                path="booking/details/:id"
                element={<BookingDetailsPage />}
              />
              <Route path="messages" element={<ChatPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Owner Routes */}
              <Route path="owner/dashboard" element={<OwnerDashboardPage />} />
              <Route path="owner/listings" element={<MyListingsPage />} />
              <Route path="owner/listings/new" element={<AddListingPage />} />
              <Route
                path="owner/listings/:id/edit"
                element={<EditListingPage />}
              />
            </Route>

            {/* Admin Routes */}
            <Route
              path="admin"
              element={<ProtectedRoute requiredRole="admin" />}
            >
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="listings" element={<AdminListingsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
            </Route>
          </Route>

          {/* Auth Routes (outside Layout) */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

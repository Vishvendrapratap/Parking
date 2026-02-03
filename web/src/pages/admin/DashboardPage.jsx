import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/services";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, usersRes, bookingsRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getUsers({ limit: 5 }),
        adminService.getBookings({ limit: 5 }),
      ]);

      setStats(dashboardRes.data);
      setRecentUsers(usersRes.data || []);
      setRecentBookings(bookingsRes.data || []);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm">Total Users</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</p>
          <p className="text-blue-200 text-sm mt-2">
            +{stats?.newUsersThisMonth || 0} this month
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm">Total Listings</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalListings || 0}</p>
          <p className="text-green-200 text-sm mt-2">
            {stats?.activeListings || 0} active
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalBookings || 0}</p>
          <p className="text-purple-200 text-sm mt-2">
            {stats?.bookingsThisMonth || 0} this month
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <p className="text-orange-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">
            ${stats?.totalRevenue?.toFixed(0) || 0}
          </p>
          <p className="text-orange-200 text-sm mt-2">
            ${stats?.revenueThisMonth?.toFixed(0) || 0} this month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Users
            </h2>
            <Link
              to="/admin/users"
              className="text-primary-600 text-sm hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    User
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Role
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user._id} className="border-b last:border-b-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 text-sm font-medium">
                            {user.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : user.role === "owner"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Bookings
            </h2>
            <Link
              to="/admin/bookings"
              className="text-primary-600 text-sm hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {booking.parkingSpace?.title || "Unknown Space"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.user?.name} •{" "}
                    {new Date(booking.startTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">
                    ${booking.totalPrice?.toFixed(2)}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      booking.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : booking.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="card hover:shadow-lg transition-shadow text-center"
        >
          <span className="text-3xl mb-2 block">👥</span>
          <p className="font-medium text-gray-800">Manage Users</p>
        </Link>
        <Link
          to="/admin/listings"
          className="card hover:shadow-lg transition-shadow text-center"
        >
          <span className="text-3xl mb-2 block">🅿️</span>
          <p className="font-medium text-gray-800">Manage Listings</p>
        </Link>
        <Link
          to="/admin/bookings"
          className="card hover:shadow-lg transition-shadow text-center"
        >
          <span className="text-3xl mb-2 block">📋</span>
          <p className="font-medium text-gray-800">Manage Bookings</p>
        </Link>
        <Link
          to="/admin/reports"
          className="card hover:shadow-lg transition-shadow text-center"
        >
          <span className="text-3xl mb-2 block">📊</span>
          <p className="font-medium text-gray-800">Reports</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;

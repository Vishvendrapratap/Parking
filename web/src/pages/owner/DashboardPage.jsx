import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ownerService,
  bookingService,
  parkingService,
} from "../../api/services";
import toast from "react-hot-toast";
import Icon from "../../components/Icon";

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, bookingsRes, listingsRes] = await Promise.all([
        ownerService.getDashboard(),
        bookingService.getOwnerBookings(),
        parkingService.getMyListings(),
      ]);

      setStats(dashboardRes.data);
      setPendingBookings(
        bookingsRes.data?.filter((b) => b.status === "pending").slice(0, 5) ||
          [],
      );
      setRecentListings(listingsRes.data?.slice(0, 4) || []);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await bookingService.updateStatus(bookingId, status);
      toast.success(`Booking ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" className="text-primary-600" size="3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
        <Link to="/owner/listings/new" className="btn-primary">
          + Add Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-primary-100 text-sm">Total Earnings</p>
          <p className="text-3xl font-bold mt-1">
            ₹{stats?.totalEarnings?.toFixed(2) || "0.00"}
          </p>
          <p className="text-primary-200 text-sm mt-2">All time</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm">This Month</p>
          <p className="text-3xl font-bold mt-1">
            ₹{stats?.monthlyEarnings?.toFixed(2) || "0.00"}
          </p>
          <p className="text-green-200 text-sm mt-2">
            {stats?.monthlyBookings || 0} bookings
          </p>
        </div>

        <div className="card">
          <p className="text-gray-500 text-sm">Active Listings</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {stats?.activeListings || 0}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {stats?.totalListings || 0} total
          </p>
        </div>

        <div className="card">
          <p className="text-gray-500 text-sm">Pending Requests</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {pendingBookings.length}
          </p>
          <p className="text-yellow-600 text-sm mt-2">Awaiting response</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Bookings */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Pending Requests
            </h2>
            <Link
              to="/owner/bookings"
              className="text-primary-600 text-sm hover:underline flex items-center gap-1"
            >
              View All <Icon name="forward" size="sm" />
            </Link>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2 text-primary-600">
                <Icon name="clipboard" size="2xl" />
              </div>
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div key={booking._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {booking.user?.name || "Guest"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.parkingSpace?.title}
                      </p>
                    </div>
                    <span className="text-primary-600 font-semibold">
                      ₹{booking.totalPrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {new Date(booking.startTime).toLocaleDateString()} -{" "}
                    {new Date(booking.endTime).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleBookingAction(booking._id, "confirmed")
                      }
                      className="btn-primary py-1 px-3 text-sm flex-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleBookingAction(booking._id, "cancelled")
                      }
                      className="btn-secondary py-1 px-3 text-sm flex-1 text-red-600 border-red-200"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Listings</h2>
            <Link
              to="/owner/listings"
              className="text-primary-600 text-sm hover:underline flex items-center gap-1"
            >
              View All <Icon name="forward" size="sm" />
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2 text-primary-600">
                <Icon name="parking" size="2xl" />
              </div>
              <p>No listings yet</p>
              <Link
                to="/owner/listings/new"
                className="text-primary-600 hover:underline text-sm"
              >
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentListings.map((listing) => (
                <Link
                  key={listing._id}
                  to={`/owner/listings/${listing._id}/edit`}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-24 bg-gray-200">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-primary-600">
                        <Icon name="parking" size="xl" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {listing.title}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-primary-600 font-semibold text-sm">
                        ${listing.pricing?.hourly}/hr
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          listing.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {listing.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/owner/listings/new"
          className="card hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
            <Icon name="plus" size="xl" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Add New Listing</p>
            <p className="text-sm text-gray-500">List a parking space</p>
          </div>
        </Link>

        <Link
          to="/owner/earnings"
          className="card hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <Icon name="money" size="xl" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">View Earnings</p>
            <p className="text-sm text-gray-500">Track your income</p>
          </div>
        </Link>

        <Link
          to="/messages"
          className="card hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Icon name="chat" size="xl" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Messages</p>
            <p className="text-sm text-gray-500">Chat with guests</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default OwnerDashboard;

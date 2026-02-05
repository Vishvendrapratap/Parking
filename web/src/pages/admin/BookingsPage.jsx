import { useState, useEffect } from "react";
import { adminService } from "../../api/services";
import toast from "react-hot-toast";

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminService.getBookings(params);
      setBookings(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Bookings</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          "all",
          "pending",
          "confirmed",
          "active",
          "completed",
          "cancelled",
        ].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`p-4 rounded-xl text-center transition-all ${
              statusFilter === status
                ? "bg-primary-600 text-white"
                : "bg-white border hover:border-primary-300"
            }`}
          >
            <p className="text-2xl font-bold">
              {status === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === status).length}
            </p>
            <p className="text-sm capitalize">
              {status === "all" ? "Total" : status}
            </p>
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Booking
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Parking Space
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-mono text-sm text-gray-600">
                        #{booking._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">
                        {booking.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.user?.email}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-800">
                        {booking.parkingSpace?.title || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.parkingSpace?.address?.city}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <p>{formatDate(booking.startTime)}</p>
                      <p className="text-gray-500">
                        to {formatDate(booking.endTime)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">
                        ₹{booking.totalPrice?.toFixed(2)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../api/services";
import toast from "react-hot-toast";
import Icon from "../components/Icon";

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        status:
          activeTab === "upcoming"
            ? "confirmed,pending"
            : "completed,cancelled",
      };
      const response = await bookingService.getAll(params);
      setBookings(response.data || []);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await bookingService.cancel(bookingId);
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to cancel booking");
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
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 font-medium ${
            activeTab === "upcoming"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 font-medium ${
            activeTab === "past"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Past
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Icon name="spinner" className="text-primary-600" size="2xl" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-primary-600">
            <Icon name="calendar" size="4xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No {activeTab} bookings
          </h3>
          <p className="text-gray-500 mb-4">
            {activeTab === "upcoming"
              ? "You don't have any upcoming bookings"
              : "You don't have any past bookings"}
          </p>
          <Link to="/search" className="btn-primary">
            Find Parking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                <div className="w-full md:w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {booking.parkingSpace?.images?.[0] ? (
                    <img
                      src={booking.parkingSpace.images[0].url}
                      alt={booking.parkingSpace.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-primary-600">
                      <Icon name="parking" size="xl" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {booking.parkingSpace?.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {booking.parkingSpace?.address?.street}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p className="font-medium">
                        {formatDate(booking.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p className="font-medium">
                        {formatDate(booking.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-primary-600">
                      ${booking.totalPrice?.toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/booking/details/${booking._id}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        View Details
                      </Link>
                      {(booking.status === "pending" ||
                        booking.status === "confirmed") && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;

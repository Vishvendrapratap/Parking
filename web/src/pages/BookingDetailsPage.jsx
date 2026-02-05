import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { bookingService } from "../api/services";
import toast from "react-hot-toast";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await bookingService.getById(id);
      setBooking(response.data);
    } catch (error) {
      toast.error("Failed to load booking details");
      navigate("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await bookingService.cancel(id);
      toast.success("Booking cancelled successfully");
      fetchBooking();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const handleSubmitReview = async () => {
    try {
      await bookingService.addReview(id, review);
      toast.success("Review submitted successfully");
      setShowReviewModal(false);
      fetchBooking();
    } catch (error) {
      toast.error("Failed to submit review");
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking not found</p>
      </div>
    );
  }

  const space = booking.parkingSpace;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            to="/bookings"
            className="text-primary-600 hover:underline text-sm mb-2 inline-block"
          >
            ← Back to bookings
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
        </div>
        <span
          className={`px-4 py-2 rounded-full font-medium ${getStatusColor(booking.status)}`}
        >
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parking Space Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Parking Space
            </h2>
            <div className="flex gap-4">
              <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {space?.images?.[0] ? (
                  <img
                    src={space.images[0].url}
                    alt={space.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🅿️
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{space?.title}</h3>
                <p className="text-sm text-gray-500">
                  {space?.address?.street}
                </p>
                <p className="text-sm text-gray-500">
                  {space?.address?.city}, {space?.address?.state}{" "}
                  {space?.address?.zipCode}
                </p>
                <Link
                  to={`/parking/${space?._id}`}
                  className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                >
                  View listing →
                </Link>
              </div>
            </div>
          </div>

          {/* Time Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Booking Time
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Check-in</p>
                <p className="font-medium text-gray-800">
                  {formatDate(booking.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Check-out</p>
                <p className="font-medium text-gray-800">
                  {formatDate(booking.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {booking.vehicleInfo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🚗 Vehicle Information
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {booking.vehicleInfo.licensePlate && (
                  <div>
                    <p className="text-sm text-gray-500">License Plate</p>
                    <p className="font-medium text-gray-800 uppercase">
                      {booking.vehicleInfo.licensePlate}
                    </p>
                  </div>
                )}
                {booking.vehicleInfo.type && (
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {booking.vehicleInfo.type}
                    </p>
                  </div>
                )}
                {booking.vehicleInfo.make && (
                  <div>
                    <p className="text-sm text-gray-500">Make</p>
                    <p className="font-medium text-gray-800">
                      {booking.vehicleInfo.make}
                    </p>
                  </div>
                )}
                {booking.vehicleInfo.model && (
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium text-gray-800">
                      {booking.vehicleInfo.model}
                    </p>
                  </div>
                )}
                {booking.vehicleInfo.color && (
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-medium text-gray-800">
                      {booking.vehicleInfo.color}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Map */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📍 Location
            </h2>
            <div className="h-64 rounded-xl overflow-hidden bg-gray-200">
              {isLoaded && space?.location?.coordinates ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{
                    lat: space.location.coordinates[1],
                    lng: space.location.coordinates[0],
                  }}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  <Marker
                    position={{
                      lat: space.location.coordinates[1],
                      lng: space.location.coordinates[0],
                    }}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Map loading...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Pricing Card */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Parking fee</span>
                  <span>₹{(booking.totalPrice * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service fee</span>
                  <span>₹{(booking.totalPrice * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800 pt-3 border-t">
                  <span>Total</span>
                  <span>₹{booking.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card space-y-3">
              {(booking.status === "pending" ||
                booking.status === "confirmed") && (
                <button
                  onClick={handleCancelBooking}
                  className="btn-secondary w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel Booking
                </button>
              )}

              {booking.status === "completed" && !booking.review && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="btn-primary w-full"
                >
                  Write a Review
                </button>
              )}

              <Link
                to={`/messages?space=${space?._id}`}
                className="btn-secondary w-full text-center block"
              >
                Contact Owner
              </Link>
            </div>

            {/* Owner Info */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Host</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {space?.owner?.name?.charAt(0) || "O"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {space?.owner?.name}
                  </p>
                  <p className="text-sm text-gray-500">Space Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Write a Review
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReview({ ...review, rating: star })}
                    className="text-2xl"
                  >
                    {star <= review.rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={review.comment}
                onChange={(e) =>
                  setReview({ ...review, comment: e.target.value })
                }
                rows={4}
                className="input-field"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="btn-primary flex-1"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;

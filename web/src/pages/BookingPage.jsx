import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parkingService, bookingService } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    vehicleInfo: {
      type: "sedan",
      make: "",
      model: "",
      color: "",
      licensePlate: "",
    },
    notes: "",
  });

  const [pricing, setPricing] = useState({
    duration: 0,
    subtotal: 0,
    serviceFee: 0,
    total: 0,
  });

  const vehicleTypes = ["sedan", "suv", "truck", "motorcycle", "rv"];

  useEffect(() => {
    fetchParkingSpace();
  }, [id]);

  useEffect(() => {
    calculatePricing();
  }, [
    formData.startDate,
    formData.startTime,
    formData.endDate,
    formData.endTime,
    space,
  ]);

  const fetchParkingSpace = async () => {
    try {
      const response = await parkingService.getById(id);
      setSpace(response.data);

      // Set default dates
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      setFormData((prev) => ({
        ...prev,
        startDate: formatDate(now),
        startTime: "09:00",
        endDate: formatDate(now),
        endTime: "17:00",
      }));
    } catch (error) {
      toast.error("Failed to load parking space");
      navigate("/search");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const calculatePricing = () => {
    if (
      !space ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      return;
    }

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    const durationMs = end - start;
    if (durationMs <= 0) {
      setPricing({ duration: 0, subtotal: 0, serviceFee: 0, total: 0 });
      return;
    }

    const hours = Math.ceil(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let subtotal = 0;

    // Calculate based on daily rate if more than 8 hours
    if (days > 0 && space.pricing?.daily) {
      subtotal += days * space.pricing.daily;
    } else {
      subtotal += days * 24 * space.pricing.hourly;
    }

    subtotal += remainingHours * space.pricing.hourly;

    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;

    setPricing({
      duration: hours,
      subtotal: subtotal.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      total: total.toFixed(2),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("vehicle.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vehicleInfo: { ...prev.vehicleInfo, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pricing.duration <= 0) {
      toast.error("Please select valid booking times");
      return;
    }

    if (!formData.vehicleInfo.licensePlate) {
      toast.error("Please enter your license plate number");
      return;
    }

    setSubmitting(true);

    try {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`,
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const bookingData = {
        parkingSpace: id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        vehicleInfo: formData.vehicleInfo,
        notes: formData.notes,
      };

      const response = await bookingService.create(bookingData);
      toast.success("Booking created successfully!");
      navigate(`/booking/confirmation/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Complete Your Booking
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Time */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📅 Select Date & Time
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={formatDate(new Date())}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {pricing.duration > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  Duration: {pricing.duration} hour(s)
                </p>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🚗 Vehicle Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicle.type"
                    value={formData.vehicleInfo.type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="vehicle.licensePlate"
                    value={formData.vehicleInfo.licensePlate}
                    onChange={handleChange}
                    placeholder="ABC 1234"
                    className="input-field uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
                  <input
                    type="text"
                    name="vehicle.make"
                    value={formData.vehicleInfo.make}
                    onChange={handleChange}
                    placeholder="Toyota"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="vehicle.model"
                    value={formData.vehicleInfo.model}
                    onChange={handleChange}
                    placeholder="Camry"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    name="vehicle.color"
                    value={formData.vehicleInfo.color}
                    onChange={handleChange}
                    placeholder="Silver"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📝 Additional Notes
              </h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special requests or instructions..."
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || pricing.duration <= 0}
              className="btn-primary w-full py-3 text-lg"
            >
              {submitting
                ? "Processing..."
                : `Confirm Booking - ₹${pricing.total}`}
            </button>
          </form>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Booking Summary
            </h2>

            {/* Space Info */}
            <div className="flex gap-3 pb-4 border-b">
              <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                <h3 className="font-medium text-gray-800">{space?.title}</h3>
                <p className="text-sm text-gray-500">
                  {space?.address?.street}
                </p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="py-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>
                  ₹{space?.pricing?.hourly} × {pricing.duration} hours
                </span>
                <span>₹{pricing.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Service fee</span>
                <span>₹{pricing.serviceFee}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800 pt-3 border-t">
                <span>Total</span>
                <span>₹{pricing.total}</span>
              </div>
            </div>

            {/* Info */}
            <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
              <p>✓ Free cancellation up to 24 hours before</p>
              <p>✓ Secure payment processing</p>
              <p>✓ Instant confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    parkingSpace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSpace",
      required: true,
    },
    seeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Booking time details
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    // Duration in hours (calculated)
    duration: {
      type: Number,
      required: true,
    },
    // Pricing
    pricePerHour: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    // Vehicle details
    vehicleInfo: {
      type: {
        type: String,
        enum: ["small", "sedan", "suv"],
      },
      licensePlate: String,
      make: String,
      model: String,
      color: String,
    },
    // Booking status
    status: {
      type: String,
      enum: [
        "pending", // Waiting for owner approval
        "confirmed", // Owner approved
        "active", // Currently in use
        "completed", // Successfully completed
        "cancelled", // Cancelled by seeker or owner
        "rejected", // Rejected by owner
        "expired", // Booking time passed without confirmation
      ],
      default: "pending",
    },
    // Payment details
    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "refunded", "failed"],
        default: "pending",
      },
      method: {
        type: String,
        enum: ["card", "wallet", "cash"],
      },
      transactionId: String,
      paidAt: Date,
    },
    // Cancellation details
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    // Review
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    // Special requests
    specialRequests: {
      type: String,
      maxlength: 500,
    },
    // Check-in/Check-out
    checkIn: {
      time: Date,
      photo: String,
    },
    checkOut: {
      time: Date,
      photo: String,
    },
    // Completion OTP (for seeker-initiated completion)
    completionOtp: {
      code: String,
      expiresAt: Date,
      verified: { type: Boolean, default: false },
    },
    // Notifications sent
    notificationsSent: {
      bookingConfirmed: { type: Boolean, default: false },
      reminderSent: { type: Boolean, default: false },
      checkInReminder: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
bookingSchema.index({ parkingSpace: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ seeker: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startTime: 1 });

// Calculate duration before saving
bookingSchema.pre("save", function (next) {
  if (this.startTime && this.endTime) {
    const diffMs = this.endTime - this.startTime;
    this.duration = Math.ceil(diffMs / (1000 * 60 * 60)); // Convert to hours
  }
  next();
});

// Static method to check availability
bookingSchema.statics.checkAvailability = async function (
  parkingSpaceId,
  startTime,
  endTime,
  excludeBookingId = null,
) {
  const query = {
    parkingSpace: parkingSpaceId,
    status: { $in: ["pending", "confirmed", "active"] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await this.findOne(query);
  return !conflictingBooking;
};

// Static method to get user's bookings
bookingSchema.statics.getUserBookings = function (
  userId,
  role = "seeker",
  status = null,
) {
  const query = role === "owner" ? { owner: userId } : { seeker: userId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate("parkingSpace", "title location images pricePerHour")
    .populate("seeker", "name avatar phone")
    .populate("owner", "name avatar phone")
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Booking", bookingSchema);

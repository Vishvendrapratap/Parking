const Booking = require("../models/Booking");
const ParkingSpace = require("../models/ParkingSpace");
const User = require("../models/User");

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (Seeker)
exports.createBooking = async (req, res) => {
  try {
    const { parkingSpaceId, startTime, endTime, vehicleInfo, specialRequests } =
      req.body;

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check if user is trying to book their own parking space
    if (parkingSpace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own parking space",
      });
    }

    if (parkingSpace.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Parking space is not available",
      });
    }

    // Check availability
    const isAvailable = await Booking.checkAvailability(
      parkingSpaceId,
      new Date(startTime),
      new Date(endTime),
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    // Calculate pricing
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const totalPrice = hours * parkingSpace.pricePerHour;
    const serviceFee = totalPrice * 0.1; // 10% service fee

    const booking = await Booking.create({
      parkingSpace: parkingSpaceId,
      seeker: req.user.id,
      owner: parkingSpace.owner,
      startTime,
      endTime,
      duration: hours,
      pricePerHour: parkingSpace.pricePerHour,
      totalPrice: totalPrice + serviceFee,
      serviceFee,
      vehicleInfo,
      specialRequests,
      status: "pending",
    });

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("parkingSpace", "title location images")
      .populate("owner", "name avatar phone");

    // Emit socket event to notify owner
    const io = req.app.get("io");
    io.to(`user_${parkingSpace.owner}`).emit("new_booking", {
      booking: populatedBooking,
    });

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;

    console.log(
      "getBookings called - user:",
      req.user.id,
      "role param:",
      role,
      "user.role:",
      req.user.role,
    );

    const userRole = role || (req.user.role === "owner" ? "owner" : "seeker");
    const query =
      userRole === "owner" ? { owner: req.user.id } : { seeker: req.user.id };

    console.log("Query being used:", JSON.stringify(query));

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("parkingSpace", "title location images pricePerHour")
      .populate("seeker", "name avatar phone")
      .populate("owner", "name avatar phone")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    console.log("Found bookings:", bookings.length);
    bookings.forEach((b, i) => {
      console.log(
        `  Booking ${i + 1}: id=${b._id}, status="${b.status}", title="${b.parkingSpace?.title}"`,
      );
    });

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    console.error("Error in getBookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("parkingSpace")
      .populate("seeker", "name avatar phone email")
      .populate("owner", "name avatar phone email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    if (
      booking.seeker._id.toString() !== req.user._id.toString() &&
      booking.owner._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

// @desc    Update booking status (confirm/reject)
// @route   PUT /api/bookings/:id/status
// @access  Private (Owner)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is owner or admin
    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "rejected"],
      confirmed: ["active", "cancelled"],
      active: ["completed"],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;

    if (status === "rejected" || status === "cancelled") {
      booking.cancellation = {
        cancelledBy: req.user.id,
        reason,
        cancelledAt: new Date(),
      };
    }

    await booking.save();

    // Update parking space status if needed
    if (status === "confirmed") {
      await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
        status: "booked",
      });
    } else if (
      status === "completed" ||
      status === "cancelled" ||
      status === "rejected"
    ) {
      await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
        status: "available",
      });
    }

    // Notify seeker
    const io = req.app.get("io");
    const seekerId = booking.seeker.toString();
    console.log(
      `Emitting booking_update to user_${seekerId}, status: ${status}`,
    );
    io.to(`user_${seekerId}`).emit("booking_update", {
      bookingId: booking._id,
      status,
      message: `Your booking has been ${status}`,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("parkingSpace", "title location")
      .populate("seeker", "name avatar")
      .populate("owner", "name avatar");

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating booking",
      error: error.message,
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    console.log("cancelBooking called:");
    console.log("  req.params.id:", req.params.id);
    console.log("  req.user._id:", req.user._id);
    console.log("  req.user.id:", req.user.id);
    console.log("  booking seeker:", booking?.seeker);
    console.log("  booking owner:", booking?.owner);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is seeker, owner, or admin
    const isSeeker = booking.seeker.toString() === req.user._id.toString();
    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    console.log(
      "  isSeeker:",
      isSeeker,
      "| seeker compare:",
      booking.seeker.toString(),
      "vs",
      req.user._id.toString(),
    );
    console.log(
      "  isOwner:",
      isOwner,
      "| owner compare:",
      booking.owner.toString(),
      "vs",
      req.user._id.toString(),
    );
    console.log("  isAdmin:", isAdmin);

    if (!isSeeker && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Can only cancel pending or confirmed bookings
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this booking",
      });
    }

    booking.status = "cancelled";
    booking.cancellation = {
      cancelledBy: req.user.id,
      reason,
      cancelledAt: new Date(),
    };

    await booking.save();

    // Update parking space status
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
      status: "available",
    });

    // Notify the other party
    const notifyUser =
      booking.seeker.toString() === req.user._id.toString()
        ? booking.owner
        : booking.seeker;

    const io = req.app.get("io");
    io.to(`user_${notifyUser}`).emit("booking_cancelled", {
      bookingId: booking._id,
      reason,
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

// @desc    Add review to booking
// @route   PUT /api/bookings/:id/review
// @access  Private (Seeker)
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only seeker can review
    if (booking.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Can only review completed bookings
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      });
    }

    if (booking.review?.rating) {
      return res.status(400).json({
        success: false,
        message: "Already reviewed",
      });
    }

    booking.review = {
      rating,
      comment,
      createdAt: new Date(),
    };

    await booking.save();

    // Update parking space rating
    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    const totalRating =
      parkingSpace.rating * parkingSpace.totalReviews + rating;
    parkingSpace.totalReviews += 1;
    parkingSpace.rating = totalRating / parkingSpace.totalReviews;
    await parkingSpace.save();

    // Update owner rating
    const owner = await User.findById(booking.owner);
    const ownerTotalRating = owner.rating * owner.totalReviews + rating;
    owner.totalReviews += 1;
    owner.rating = ownerTotalRating / owner.totalReviews;
    await owner.save();

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
};

// @desc    Check-in to booking
// @route   PUT /api/bookings/:id/checkin
// @access  Private (Seeker)
exports.checkIn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking must be confirmed to check in",
      });
    }

    booking.status = "active";
    booking.checkIn = {
      time: new Date(),
      photo: req.body.photo,
    };

    await booking.save();

    // Notify owner
    const io = req.app.get("io");
    io.to(`user_${booking.owner}`).emit("booking_checkin", {
      bookingId: booking._id,
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking in",
      error: error.message,
    });
  }
};

// @desc    Check-out from booking
// @route   PUT /api/bookings/:id/checkout
// @access  Private (Seeker)
exports.checkOut = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (booking.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Booking must be active to check out",
      });
    }

    booking.status = "completed";
    booking.checkOut = {
      time: new Date(),
      photo: req.body.photo,
    };

    await booking.save();

    // Update parking space
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
      status: "available",
    });

    // Update parking space booking count
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
      $inc: { totalBookings: 1 },
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking out",
      error: error.message,
    });
  }
};

// @desc    Initiate booking completion (generates OTP for owner)
// @route   PUT /api/bookings/:id/initiate-completion
// @access  Private (Seeker)
exports.initiateCompletion = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("parkingSpace", "title")
      .populate("seeker", "name")
      .populate("owner", "name");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only seeker can initiate completion
    if (booking.seeker._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seeker can initiate completion",
      });
    }

    // Booking must be confirmed or active
    if (!["confirmed", "active"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking must be confirmed or active to complete",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    booking.completionOtp = {
      code: otp,
      expiresAt: otpExpiry,
      verified: false,
    };

    await booking.save();

    // Send OTP to owner via socket
    const io = req.app.get("io");
    io.to(`user_${booking.owner._id}`).emit("completion_otp", {
      bookingId: booking._id,
      otp: otp,
      seekerName: booking.seeker.name,
      parkingTitle: booking.parkingSpace.title,
      message: `Share this OTP with ${booking.seeker.name} to complete the parking: ${otp}`,
    });

    console.log(`Completion OTP ${otp} sent to owner ${booking.owner._id} for booking ${booking._id}`);

    res.status(200).json({
      success: true,
      message: "OTP sent to owner. Please ask owner for the OTP to complete.",
      data: {
        bookingId: booking._id,
        expiresAt: otpExpiry,
      },
    });
  } catch (error) {
    console.error("Error initiating completion:", error);
    res.status(500).json({
      success: false,
      message: "Error initiating completion",
      error: error.message,
    });
  }
};

// @desc    Verify completion OTP and complete booking
// @route   PUT /api/bookings/:id/verify-completion
// @access  Private (Seeker)
exports.verifyCompletion = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only seeker can verify completion
    if (booking.seeker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seeker can verify completion",
      });
    }

    // Check if OTP exists
    if (!booking.completionOtp?.code) {
      return res.status(400).json({
        success: false,
        message: "Please initiate completion first",
      });
    }

    // Check if OTP expired
    if (new Date() > new Date(booking.completionOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (booking.completionOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark as completed
    booking.status = "completed";
    booking.completionOtp.verified = true;
    booking.checkOut = {
      time: new Date(),
    };

    await booking.save();

    // Update parking space status
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
      status: "available",
    });

    // Update parking space booking count
    await ParkingSpace.findByIdAndUpdate(booking.parkingSpace, {
      $inc: { totalBookings: 1 },
    });

    // Notify owner of completion
    const io = req.app.get("io");
    io.to(`user_${booking.owner}`).emit("booking_completed", {
      bookingId: booking._id,
      message: "Booking has been completed successfully",
    });

    res.status(200).json({
      success: true,
      message: "Booking completed successfully!",
      data: booking,
    });
  } catch (error) {
    console.error("Error verifying completion:", error);
    res.status(500).json({
      success: false,
      message: "Error completing booking",
      error: error.message,
    });
  }
};

const ParkingSpace = require("../models/ParkingSpace");
const Booking = require("../models/Booking");
const { cloudinary } = require("../config/cloudinary");

// @desc    Get all parking spaces (with filters)
// @route   GET /api/parking
// @access  Public
exports.getParkingSpaces = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,
      parkingSize,
      maxPrice,
      minPrice,
      amenities,
      page = 1,
      limit = 20,
      sortBy = "distance",
    } = req.query;

    let query = { isActive: true };

    // Only show active listings to seekers (not draft or inactive)
    query.listingStatus = "active";

    // Only add status filter if there are parking spaces
    // This prevents issues when db is empty
    query.status = "available";

    // Location-based search - only if lat/lng provided
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    // Filters
    if (parkingSize) {
      query.parkingSize = parkingSize;
    }

    if (maxPrice) {
      query.pricePerHour = {
        ...query.pricePerHour,
        $lte: parseFloat(maxPrice),
      };
    }

    if (minPrice) {
      query.pricePerHour = {
        ...query.pricePerHour,
        $gte: parseFloat(minPrice),
      };
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(",") };
    }

    let parkingSpaces;
    let total;

    try {
      parkingSpaces = await ParkingSpace.find(query)
        .populate("owner", "name avatar rating")
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      total = await ParkingSpace.countDocuments(query);
    } catch (geoError) {
      // If geospatial query fails (e.g., no index or no documents),
      // fall back to simple query without location
      console.error("Geospatial query failed, falling back:", geoError.message);
      delete query["location.coordinates"];

      parkingSpaces = await ParkingSpace.find(query)
        .populate("owner", "name avatar rating")
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      total = await ParkingSpace.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      count: parkingSpaces.length,
      total,
      pages: Math.ceil(total / limit),
      data: parkingSpaces,
    });
  } catch (error) {
    console.error("Error in getParkingSpaces:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching parking spaces",
      error: error.message,
    });
  }
};

// @desc    Get single parking space
// @route   GET /api/parking/:id
// @access  Public
exports.getParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id).populate(
      "owner",
      "name avatar bio rating totalReviews phone",
    );

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    res.status(200).json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching parking space",
      error: error.message,
    });
  }
};

// @desc    Create new parking space
// @route   POST /api/parking
// @access  Private (Owner)
exports.createParkingSpace = async (req, res) => {
  try {
    req.body.owner = req.user.id;

    // Check if owner has reached the maximum limit of 3 parking spaces
    const existingCount = await ParkingSpace.countDocuments({
      owner: req.user.id,
      isActive: true,
    });

    if (existingCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "You have reached the maximum limit of 3 parking spaces",
      });
    }

    // Handle FormData from mobile app (latitude, longitude, address as separate fields)
    if (req.body.latitude && req.body.longitude && !req.body.location) {
      req.body.location = {
        type: "Point",
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude),
        ],
        address: req.body.address || "",
      };
      delete req.body.latitude;
      delete req.body.longitude;
      delete req.body.address;
    }

    // Handle location.coordinates sent as { latitude, longitude } object
    if (
      req.body.location &&
      req.body.location.coordinates &&
      typeof req.body.location.coordinates === "object" &&
      !Array.isArray(req.body.location.coordinates)
    ) {
      const { latitude, longitude } = req.body.location.coordinates;
      req.body.location.coordinates = [
        parseFloat(longitude),
        parseFloat(latitude),
      ];
      req.body.location.type = "Point";
    }

    // Parse amenities if sent as JSON string
    if (typeof req.body.amenities === "string") {
      try {
        req.body.amenities = JSON.parse(req.body.amenities);
      } catch (e) {
        req.body.amenities = [];
      }
    }

    // Parse availabilitySchedule if sent as JSON string
    if (typeof req.body.availabilitySchedule === "string") {
      try {
        req.body.availabilitySchedule = JSON.parse(
          req.body.availabilitySchedule,
        );
      } catch (e) {
        // Keep default if parse fails
        delete req.body.availabilitySchedule;
      }
    }

    const parkingSpace = await ParkingSpace.create(req.body);

    res.status(201).json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating parking space",
      error: error.message,
    });
  }
};

// @desc    Update parking space
// @route   PUT /api/parking/:id
// @access  Private (Owner)
exports.updateParkingSpace = async (req, res) => {
  try {
    let parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (
      parkingSpace.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this parking space",
      });
    }

    // Block updates if listing is active (except for status changes by admin)
    if (parkingSpace.listingStatus === "active" && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit an active listing. Please deactivate it first.",
      });
    }

    parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating parking space",
      error: error.message,
    });
  }
};

// @desc    Delete parking space
// @route   DELETE /api/parking/:id
// @access  Private (Owner)
exports.deleteParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (
      parkingSpace.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this parking space",
      });
    }

    // Soft delete
    parkingSpace.isActive = false;
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      message: "Parking space deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting parking space",
      error: error.message,
    });
  }
};

// @desc    Upload images for parking space
// @route   POST /api/parking/:id/images
// @access  Private (Owner)
exports.uploadImages = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (parkingSpace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const newImages = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isPrimary: parkingSpace.images.length === 0 && index === 0,
    }));

    parkingSpace.images.push(...newImages);
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      data: parkingSpace.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error uploading images",
      error: error.message,
    });
  }
};

// @desc    Delete image from parking space
// @route   DELETE /api/parking/:id/images/:imageId
// @access  Private (Owner)
exports.deleteImage = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (parkingSpace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const image = parkingSpace.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    image.remove();
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      message: "Image deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message,
    });
  }
};

// @desc    Get owner's parking spaces
// @route   GET /api/parking/my-listings
// @access  Private (Owner)
exports.getMyListings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { owner: req.user.id, isActive: true };
    if (status) query.status = status;

    const parkingSpaces = await ParkingSpace.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ParkingSpace.countDocuments(query);

    res.status(200).json({
      success: true,
      count: parkingSpaces.length,
      total,
      pages: Math.ceil(total / limit),
      data: parkingSpaces,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching listings",
      error: error.message,
    });
  }
};

// @desc    Update parking space status
// @route   PUT /api/parking/:id/status
// @access  Private (Owner)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["available", "unavailable", "booked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (parkingSpace.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    parkingSpace.status = status;
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// @desc    Check parking space availability for time range
// @route   GET /api/parking/:id/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    if (parkingSpace.status !== "available") {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Parking space is not available",
      });
    }

    const isAvailable = await Booking.checkAvailability(
      req.params.id,
      new Date(startTime),
      new Date(endTime),
    );

    res.status(200).json({
      success: true,
      available: isAvailable,
      message: isAvailable ? "Available" : "Time slot already booked",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking availability",
      error: error.message,
    });
  }
};

// Helper function to generate 30-minute slots for a day
const generateDaySlots = (date, schedule, bookings) => {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[date.getDay()];
  const daySchedule = schedule?.[dayName];

  const slots = [];

  // If no schedule or not available, return empty slots for that day
  if (!daySchedule || !daySchedule.isAvailable) {
    return slots;
  }

  // Parse start and end times from schedule (format: "HH:MM")
  const [startHour, startMin] = (daySchedule.start || "00:00")
    .split(":")
    .map(Number);
  const [endHour, endMin] = (daySchedule.end || "23:59").split(":").map(Number);

  // Create slot time boundaries
  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMin, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMin, 0, 0);

  // Generate 30-minute slots
  let slotStart = new Date(dayStart);
  while (slotStart < dayEnd) {
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    if (slotEnd > dayEnd) break;

    // Check if this slot overlaps with any booking
    const isBooked = bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      // Overlap check: slot overlaps if it starts before booking ends AND ends after booking starts
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });

    // Check if slot is in the past
    const now = new Date();
    const isPast = slotStart < now;

    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      isBooked,
      isPast,
      isAvailable: !isBooked && !isPast,
    });

    slotStart = new Date(slotEnd);
  }

  return slots;
};

// @desc    Get weekly slots availability for a parking space
// @route   GET /api/parking/:id/slots
// @access  Public
exports.getWeeklySlots = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Get bookings for the next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      parkingSpace: req.params.id,
      status: { $in: ["pending", "confirmed", "active"] },
      startTime: { $lt: weekEnd },
      endTime: { $gt: today },
    });

    // Generate slots for each day
    const weeklySlots = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const daySlots = generateDaySlots(
        date,
        parkingSpace.availabilitySchedule,
        bookings,
      );

      weeklySlots.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
        slots: daySlots,
        totalSlots: daySlots.length,
        availableSlots: daySlots.filter((s) => s.isAvailable).length,
        bookedSlots: daySlots.filter((s) => s.isBooked).length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        parkingId: parkingSpace._id,
        minimumHours: 4,
        slotDurationMinutes: 30,
        weeklySlots,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching weekly slots",
      error: error.message,
    });
  }
};

// @desc    Get today's availability status for parking spaces (for tiles)
// @route   GET /api/parking/availability-status
// @access  Public
exports.getAvailabilityStatus = async (req, res) => {
  try {
    const { ids } = req.query; // Comma-separated parking IDs

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Please provide parking space IDs",
      });
    }

    const parkingIds = ids.split(",");

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayName = dayNames[today.getDay()];

    const results = [];

    for (const parkingId of parkingIds) {
      try {
        const parkingSpace = await ParkingSpace.findById(parkingId);
        if (!parkingSpace) continue;

        const schedule = parkingSpace.availabilitySchedule?.[todayName];

        // If not available today
        if (!schedule || !schedule.isAvailable) {
          results.push({
            parkingId,
            status: "unavailable",
            badge: "Closed Today",
            badgeColor: "gray",
            availableSlots: 0,
            totalSlots: 0,
          });
          continue;
        }

        // Calculate total slots for today
        const [startHour, startMin] = (schedule.start || "00:00")
          .split(":")
          .map(Number);
        const [endHour, endMin] = (schedule.end || "23:59")
          .split(":")
          .map(Number);
        const totalMinutes =
          endHour * 60 + endMin - (startHour * 60 + startMin);
        const totalSlots = Math.floor(totalMinutes / 30);

        // Get bookings for today
        const bookings = await Booking.find({
          parkingSpace: parkingId,
          status: { $in: ["pending", "confirmed", "active"] },
          startTime: { $lt: tomorrow },
          endTime: { $gt: today },
        });

        // Calculate booked slots
        let bookedSlotCount = 0;
        const now = new Date();

        // Generate all slots and check availability
        const dayStart = new Date(today);
        dayStart.setHours(startHour, startMin, 0, 0);
        const dayEnd = new Date(today);
        dayEnd.setHours(endHour, endMin, 0, 0);

        let slotStart = new Date(dayStart);
        let availableCount = 0;

        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);

          if (slotEnd > dayEnd) break;

          const isBooked = bookings.some((booking) => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return slotStart < bookingEnd && slotEnd > bookingStart;
          });

          const isPast = slotStart < now;

          if (!isBooked && !isPast) {
            availableCount++;
          }
          if (isBooked) {
            bookedSlotCount++;
          }

          slotStart = new Date(slotEnd);
        }

        // Determine status
        let status, badge, badgeColor;

        if (availableCount === 0) {
          status = "booked";
          badge = "Fully Booked";
          badgeColor = "gray";
        } else if (availableCount <= totalSlots * 0.3) {
          status = "few";
          badge = "Few Slots Left";
          badgeColor = "red";
        } else {
          status = "available";
          badge = `${availableCount} Slots`;
          badgeColor = "green";
        }

        results.push({
          parkingId,
          status,
          badge,
          badgeColor,
          availableSlots: availableCount,
          totalSlots,
        });
      } catch (err) {
        console.error(`Error processing parking ${parkingId}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching availability status",
      error: error.message,
    });
  }
};

// @desc    Activate a parking space listing
// @route   PUT /api/parking/:id/activate
// @access  Private (Owner)
exports.activateListing = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (
      parkingSpace.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to activate this listing",
      });
    }

    if (parkingSpace.listingStatus === "active") {
      return res.status(400).json({
        success: false,
        message: "Listing is already active",
      });
    }

    parkingSpace.listingStatus = "active";
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      message: "Listing activated successfully",
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error activating listing",
      error: error.message,
    });
  }
};

// @desc    Deactivate a parking space listing
// @route   PUT /api/parking/:id/deactivate
// @access  Private (Owner)
exports.deactivateListing = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    // Check ownership
    if (
      parkingSpace.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to deactivate this listing",
      });
    }

    if (parkingSpace.listingStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "Listing is not active",
      });
    }

    parkingSpace.listingStatus = "inactive";
    await parkingSpace.save();

    res.status(200).json({
      success: true,
      message: "Listing deactivated successfully",
      data: parkingSpace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deactivating listing",
      error: error.message,
    });
  }
};

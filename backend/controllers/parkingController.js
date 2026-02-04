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

    // Handle FormData from mobile app (latitude, longitude, address as separate fields)
    if (req.body.latitude && req.body.longitude && !req.body.location) {
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
        address: req.body.address || "",
      };
      delete req.body.latitude;
      delete req.body.longitude;
      delete req.body.address;
    }

    // Handle location.coordinates sent as { latitude, longitude } object
    if (req.body.location && req.body.location.coordinates && 
        typeof req.body.location.coordinates === "object" && 
        !Array.isArray(req.body.location.coordinates)) {
      const { latitude, longitude } = req.body.location.coordinates;
      req.body.location.coordinates = [parseFloat(longitude), parseFloat(latitude)];
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

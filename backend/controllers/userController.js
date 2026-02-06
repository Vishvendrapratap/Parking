const User = require("../models/User");
const ParkingSpace = require("../models/ParkingSpace");
const Booking = require("../models/Booking");

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's stats
    let stats = {};
    if (user.role === "owner") {
      stats.totalListings = await ParkingSpace.countDocuments({
        owner: user._id,
      });
      stats.activeListings = await ParkingSpace.countDocuments({
        owner: user._id,
        status: "available",
      });
      stats.totalBookingsReceived = await Booking.countDocuments({
        owner: user._id,
      });
    } else {
      stats.totalBookings = await Booking.countDocuments({ seeker: user._id });
    }

    res.status(200).json({
      success: true,
      data: { ...user.toObject(), stats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - just mark as inactive
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get owner profile with listings
// @route   GET /api/users/:id/profile
// @access  Public
exports.getOwnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name avatar bio rating totalReviews createdAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const listings = await ParkingSpace.find({
      owner: user._id,
      isActive: true,
      status: "available",
    }).select("title location images pricePerHour parkingSize rating");

    res.status(200).json({
      success: true,
      data: {
        user,
        listings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// @desc    Update push token
// @route   PUT /api/users/push-token
// @access  Private
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.pushTokens.includes(pushToken)) {
      user.pushTokens.push(pushToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Push token updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating push token",
      error: error.message,
    });
  }
};

// ==================== VEHICLE/GARAGE MANAGEMENT ====================

// @desc    Get user's vehicles (garage)
// @route   GET /api/users/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user.vehicles || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vehicles",
      error: error.message,
    });
  }
};

// @desc    Add vehicle to garage
// @route   POST /api/users/vehicles
// @access  Private
exports.addVehicle = async (req, res) => {
  try {
    const { nickname, type, licensePlate, make, model, color, isDefault } =
      req.body;

    if (!type || !licensePlate) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type and license plate are required",
      });
    }

    const user = await User.findById(req.user.id);

    // Check if license plate already exists in user's garage
    const existingVehicle = user.vehicles.find(
      (v) => v.licensePlate.toUpperCase() === licensePlate.toUpperCase(),
    );
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this license plate already exists in your garage",
      });
    }

    // If this is the first vehicle or isDefault is true, set it as default
    const shouldBeDefault = user.vehicles.length === 0 || isDefault;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      user.vehicles.forEach((v) => {
        v.isDefault = false;
      });
    }

    user.vehicles.push({
      nickname: nickname || `${make || ""} ${model || ""}`.trim() || "My Car",
      type,
      licensePlate: licensePlate.toUpperCase(),
      make,
      model,
      color,
      isDefault: shouldBeDefault,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Vehicle added to garage",
      data: user.vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding vehicle",
      error: error.message,
    });
  }
};

// @desc    Update vehicle in garage
// @route   PUT /api/users/vehicles/:vehicleId
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { nickname, type, licensePlate, make, model, color, isDefault } =
      req.body;

    const user = await User.findById(req.user.id);

    const vehicleIndex = user.vehicles.findIndex(
      (v) => v._id.toString() === vehicleId,
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if changing to a license plate that already exists
    if (licensePlate) {
      const duplicatePlate = user.vehicles.find(
        (v) =>
          v._id.toString() !== vehicleId &&
          v.licensePlate.toUpperCase() === licensePlate.toUpperCase(),
      );
      if (duplicatePlate) {
        return res.status(400).json({
          success: false,
          message: "Another vehicle with this license plate already exists",
        });
      }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      user.vehicles.forEach((v) => {
        v.isDefault = false;
      });
    }

    // Update vehicle fields
    const vehicle = user.vehicles[vehicleIndex];
    if (nickname !== undefined) vehicle.nickname = nickname;
    if (type !== undefined) vehicle.type = type;
    if (licensePlate !== undefined)
      vehicle.licensePlate = licensePlate.toUpperCase();
    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (color !== undefined) vehicle.color = color;
    if (isDefault !== undefined) vehicle.isDefault = isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated",
      data: user.vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vehicle",
      error: error.message,
    });
  }
};

// @desc    Delete vehicle from garage
// @route   DELETE /api/users/vehicles/:vehicleId
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const user = await User.findById(req.user.id);

    const vehicleIndex = user.vehicles.findIndex(
      (v) => v._id.toString() === vehicleId,
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const wasDefault = user.vehicles[vehicleIndex].isDefault;
    user.vehicles.splice(vehicleIndex, 1);

    // If deleted vehicle was default, set first remaining vehicle as default
    if (wasDefault && user.vehicles.length > 0) {
      user.vehicles[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Vehicle removed from garage",
      data: user.vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting vehicle",
      error: error.message,
    });
  }
};

// @desc    Set default vehicle
// @route   PUT /api/users/vehicles/:vehicleId/default
// @access  Private
exports.setDefaultVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const user = await User.findById(req.user.id);

    const vehicleIndex = user.vehicles.findIndex(
      (v) => v._id.toString() === vehicleId,
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Unset all defaults and set the selected one
    user.vehicles.forEach((v) => {
      v.isDefault = false;
    });
    user.vehicles[vehicleIndex].isDefault = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Default vehicle updated",
      data: user.vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting default vehicle",
      error: error.message,
    });
  }
};

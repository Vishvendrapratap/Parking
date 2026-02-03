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

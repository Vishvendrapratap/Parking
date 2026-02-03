const User = require("../models/User");
const ParkingSpace = require("../models/ParkingSpace");
const Booking = require("../models/Booking");

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalSeekers = await User.countDocuments({ role: "seeker" });
    const totalParkingSpaces = await ParkingSpace.countDocuments();
    const activeParkingSpaces = await ParkingSpace.countDocuments({
      status: "available",
      isActive: true,
    });
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({
      status: "completed",
    });

    // Revenue calculation
    const revenueData = await Booking.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          serviceFees: { $sum: "$serviceFee" },
        },
      },
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate("parkingSpace", "title")
      .populate("seeker", "name")
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Monthly bookings trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          owners: totalOwners,
          seekers: totalSeekers,
        },
        parkingSpaces: {
          total: totalParkingSpaces,
          active: activeParkingSpaces,
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          byStatus: bookingsByStatus,
        },
        revenue: {
          total: revenueData[0]?.total || 0,
          serviceFees: revenueData[0]?.serviceFees || 0,
        },
        recentBookings,
        monthlyBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message,
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sortBy = "createdAt",
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true },
    );

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

// @desc    Get all parking spaces with filters
// @route   GET /api/admin/parking
// @access  Private/Admin
exports.getAllParkingSpaces = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      isVerified,
      search,
      sortBy = "createdAt",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isVerified !== undefined) query.isVerified = isVerified === "true";
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

    const parkingSpaces = await ParkingSpace.find(query)
      .populate("owner", "name email")
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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
      message: "Error fetching parking spaces",
      error: error.message,
    });
  }
};

// @desc    Verify parking space
// @route   PUT /api/admin/parking/:id/verify
// @access  Private/Admin
exports.verifyParkingSpace = async (req, res) => {
  try {
    const { isVerified } = req.body;

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true },
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
      message: "Error verifying parking space",
      error: error.message,
    });
  }
};

// @desc    Feature/Unfeature parking space
// @route   PUT /api/admin/parking/:id/feature
// @access  Private/Admin
exports.featureParkingSpace = async (req, res) => {
  try {
    const { isFeatured } = req.body;

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true },
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
      message: "Error featuring parking space",
      error: error.message,
    });
  }
};

// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = "createdAt",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate("parkingSpace", "title location")
      .populate("seeker", "name email")
      .populate("owner", "name email")
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

// @desc    Delete parking space (Admin)
// @route   DELETE /api/admin/parking/:id
// @access  Private/Admin
exports.deleteParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: "Parking space not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Parking space deactivated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting parking space",
      error: error.message,
    });
  }
};

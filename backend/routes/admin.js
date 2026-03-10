const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");
const Location = require("../models/Location");
const Alert = require("../models/Alert");
const Geofence = require("../models/Geofence");

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalParents,
      totalChildren,
      totalAlerts,
      totalGeofences,
      activeUsers,
      sosAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "parent" }),
      User.countDocuments({ role: "child" }),
      Alert.countDocuments(),
      Geofence.countDocuments(),
      User.countDocuments({ "deviceInfo.isOnline": true }),
      Alert.countDocuments({ type: "sos" }),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAlerts = await Alert.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get daily registrations for chart
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get alerts by type
    const alertsByType = await Alert.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalParents,
        totalChildren,
        totalAlerts,
        totalGeofences,
        activeUsers,
        sosAlerts,
        recentAlerts,
        recentUsers,
        dailyRegistrations,
        alertsByType,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Private (Admin only)
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .populate("parent", "name email")
        .populate("children", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private (Admin only)
router.get("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("parent", "name email phone")
      .populate("children", "name email phone deviceInfo");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's recent activity
    const [recentAlerts, recentLocations, geofences] = await Promise.all([
      Alert.find({
        $or: [{ child: user._id }, { parent: user._id }],
      })
        .sort({ createdAt: -1 })
        .limit(10),
      Location.find({ user: user._id }).sort({ timestamp: -1 }).limit(10),
      user.role === "parent" ? Geofence.find({ parent: user._id }) : [],
    ]);

    res.json({
      success: true,
      user,
      activity: {
        recentAlerts,
        recentLocations,
        geofences,
      },
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin)
// @access  Private (Admin only)
router.put("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, phone, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role && ["parent", "child", "admin"].includes(role)) user.role = role;
    if (isActive !== undefined) user.deviceInfo.isOnline = isActive;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    // If parent, unlink all children
    if (user.role === "parent") {
      await User.updateMany({ parent: user._id }, { $set: { parent: null } });
    }

    // If child, remove from parent's children array
    if (user.role === "child" && user.parent) {
      await User.findByIdAndUpdate(user.parent, {
        $pull: { children: user._id },
      });
    }

    // Delete related data
    await Promise.all([
      Alert.deleteMany({ $or: [{ child: user._id }, { parent: user._id }] }),
      Location.deleteMany({ user: user._id }),
      Geofence.deleteMany({ parent: user._id }),
    ]);

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin user delete error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/admin/alerts
// @desc    Get all alerts (system-wide)
// @access  Private (Admin only)
router.get("/alerts", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 50, type = "", priority = "" } = req.query;

    const query = {};
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate("child", "name email")
        .populate("parent", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(query),
    ]);

    res.json({
      success: true,
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Admin alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/admin/create-admin
// @desc    Create a new admin user (only existing admin can do this)
// @access  Private (Admin only)
router.post("/create-admin", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/admin/activity-log
// @desc    Get system activity log
// @access  Private (Admin only)
router.get("/activity-log", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get recent alerts as activity log
    const activities = await Alert.find()
      .populate("child", "name email")
      .populate("parent", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments();

    res.json({
      success: true,
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

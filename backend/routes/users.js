const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("children", "name email avatar deviceInfo currentLocation")
      .populate("parent", "name email avatar");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    protect,
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("phone").optional().trim(),
    validate,
  ],
  async (req, res) => {
    try {
      const { name, phone, avatar } = req.body;

      const updateFields = {};
      if (name) updateFields.name = name;
      if (phone !== undefined) updateFields.phone = phone;
      if (avatar !== undefined) updateFields.avatar = avatar;

      const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put("/settings", protect, async (req, res) => {
  try {
    const { settings } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: { ...req.user.settings, ...settings } },
      { new: true },
    );

    res.json({
      success: true,
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/users/device
// @desc    Update device info (for child)
// @access  Private
router.put("/device", protect, async (req, res) => {
  try {
    const { batteryLevel, deviceType } = req.body;

    const updateFields = {
      "deviceInfo.lastSeen": new Date(),
      "deviceInfo.isOnline": true,
    };

    if (batteryLevel !== undefined) {
      updateFields["deviceInfo.batteryLevel"] = batteryLevel;
    }
    if (deviceType) {
      updateFields["deviceInfo.deviceType"] = deviceType;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
    });

    // Check for low battery and create alert
    if (batteryLevel <= 15 && req.user.role === "child" && req.user.parent) {
      const Alert = require("../models/Alert");
      const existingAlert = await Alert.findOne({
        child: req.user._id,
        type: "battery_low",
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 mins
      });

      if (!existingAlert) {
        await Alert.create({
          type: "battery_low",
          priority: batteryLevel <= 5 ? "critical" : "high",
          title: "Low Battery Alert",
          message: `${req.user.name}'s device battery is at ${batteryLevel}%`,
          child: req.user._id,
          parent: req.user.parent,
          metadata: { batteryLevel },
        });

        // Emit socket event
        const io = req.app.get("io");
        if (io) {
          io.to(`parent_${req.user.parent}`).emit("alert", {
            type: "battery_low",
            childId: req.user._id,
            batteryLevel,
          });
        }
      }
    }

    res.json({
      success: true,
      deviceInfo: user.deviceInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

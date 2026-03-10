const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { handleBase64Upload } = require("../middleware/upload");
const Alert = require("../models/Alert");
const User = require("../models/User");

// @route   GET /api/alerts
// @desc    Get all alerts for parent
// @access  Private (Parent only)
router.get("/", protect, authorize("parent"), async (req, res) => {
  try {
    const { type, isRead, limit = 50, page = 1 } = req.query;

    const query = { parent: req.user._id };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("child", "name avatar")
      .populate("geofence", "name type");

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({
      parent: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      count: alerts.length,
      total,
      unreadCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/alerts/unread-count
// @desc    Get unread alert count
// @access  Private (Parent only)
router.get("/unread-count", protect, authorize("parent"), async (req, res) => {
  try {
    const count = await Alert.getUnreadCount(req.user._id);
    res.json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/alerts/sos
// @desc    Trigger SOS alert with optional camera images (for child)
// @access  Private (Child only)
router.post(
  "/sos",
  [
    protect,
    authorize("child"),
    handleBase64Upload,
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],
  async (req, res) => {
    try {
      if (!req.user.parent) {
        return res.status(400).json({
          success: false,
          message: "No parent account linked",
        });
      }

      const { latitude, longitude, address, message } = req.body;

      // Prepare image data
      const images = {};
      if (req.files?.frontCamera?.[0]) {
        images.frontCamera = {
          filename: req.files.frontCamera[0].filename,
          path: `/uploads/sos/${req.user._id}/${req.files.frontCamera[0].filename}`,
          capturedAt: new Date(),
        };
      }
      if (req.files?.backCamera?.[0]) {
        images.backCamera = {
          filename: req.files.backCamera[0].filename,
          path: `/uploads/sos/${req.user._id}/${req.files.backCamera[0].filename}`,
          capturedAt: new Date(),
        };
      }

      const alert = await Alert.create({
        type: "sos",
        priority: "critical",
        title: "SOS Emergency Alert!",
        message:
          message || `${req.user.name} has triggered an emergency SOS alert!`,
        child: req.user._id,
        parent: req.user.parent,
        location: {
          latitude: latitude || req.user.currentLocation?.latitude,
          longitude: longitude || req.user.currentLocation?.longitude,
          address: address || req.user.currentLocation?.address,
        },
        metadata: {
          batteryLevel: req.user.deviceInfo?.batteryLevel,
          deviceInfo: req.user.deviceInfo?.deviceType,
        },
        images: Object.keys(images).length > 0 ? images : undefined,
      });

      // Emit socket event with images
      const io = req.app.get("io");
      if (io) {
        io.to(`parent_${req.user.parent}`).emit("sos", {
          alert,
          child: {
            id: req.user._id,
            name: req.user.name,
          },
          images,
          playSound: true, // Signal parent to play SOS sound
        });
      }

      res.status(201).json({
        success: true,
        message: "SOS alert sent successfully",
        alert,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   PUT /api/alerts/:id/read
// @desc    Mark alert as read
// @access  Private (Parent only)
router.put("/:id/read", protect, authorize("parent"), async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, parent: req.user._id },
      { isRead: true },
      { new: true },
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/alerts/:id/acknowledge
// @desc    Acknowledge alert (especially SOS)
// @access  Private (Parent only)
router.put(
  "/:id/acknowledge",
  protect,
  authorize("parent"),
  async (req, res) => {
    try {
      const alert = await Alert.findOneAndUpdate(
        { _id: req.params.id, parent: req.user._id },
        {
          isRead: true,
          isAcknowledged: true,
          acknowledgedAt: new Date(),
        },
        { new: true },
      );

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      // Notify child that SOS was acknowledged
      const io = req.app.get("io");
      if (io && alert.type === "sos") {
        io.to(`child_${alert.child}`).emit("sosAcknowledged", {
          alertId: alert._id,
          acknowledgedAt: alert.acknowledgedAt,
        });
      }

      res.json({
        success: true,
        alert,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   PUT /api/alerts/read-all
// @desc    Mark all alerts as read
// @access  Private (Parent only)
router.put("/read-all", protect, authorize("parent"), async (req, res) => {
  try {
    await Alert.updateMany(
      { parent: req.user._id, isRead: false },
      { isRead: true },
    );

    res.json({
      success: true,
      message: "All alerts marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/alerts/:id
// @desc    Delete an alert
// @access  Private (Parent only)
router.delete("/:id", protect, authorize("parent"), async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      parent: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/alerts
// @desc    Delete all alerts
// @access  Private (Parent only)
router.delete("/", protect, authorize("parent"), async (req, res) => {
  try {
    await Alert.deleteMany({ parent: req.user._id });

    res.json({
      success: true,
      message: "All alerts deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/alerts/offline
// @desc    Create offline/logout alert (for child)
// @access  Private (Child only)
router.post(
  "/offline",
  [
    protect,
    authorize("child"),
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],
  async (req, res) => {
    try {
      if (!req.user.parent) {
        return res.status(400).json({
          success: false,
          message: "No parent account linked",
        });
      }

      const { latitude, longitude, message } = req.body;

      const alert = await Alert.create({
        type: "offline",
        priority: "medium",
        title: "Child Logged Out",
        message: message || `${req.user.name} has gone offline`,
        child: req.user._id,
        parent: req.user.parent,
        location: {
          latitude: latitude || null,
          longitude: longitude || null,
        },
        metadata: {
          batteryLevel: req.user.deviceInfo?.batteryLevel,
          deviceInfo: req.user.deviceInfo?.deviceType,
          logoutTime: new Date(),
        },
      });

      // Emit socket event to notify parent
      const io = req.app.get("io");
      if (io) {
        io.to(`parent_${req.user.parent}`).emit("childOffline", {
          alert,
          childId: req.user._id,
          childName: req.user.name,
          location: latitude && longitude ? { latitude, longitude } : null,
          logoutTime: new Date(),
        });
      }

      res.status(201).json({
        success: true,
        message: "Offline alert sent successfully",
        alert,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

module.exports = router;

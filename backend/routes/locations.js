const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize, isParentOfChild } = require("../middleware/auth");
const Location = require("../models/Location");
const User = require("../models/User");
const Geofence = require("../models/Geofence");
const Alert = require("../models/Alert");

// @route   POST /api/locations
// @desc    Update current location (for child)
// @access  Private (Child only)
router.post(
  "/",
  [
    protect,
    authorize("child"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        address,
      } = req.body;

      // Save location to history
      const location = await Location.create({
        user: req.user._id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        address,
      });

      // Update user's current location
      await User.findByIdAndUpdate(req.user._id, {
        currentLocation: {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
          address,
        },
        "deviceInfo.lastSeen": new Date(),
        "deviceInfo.isOnline": true,
      });

      // Check geofences
      if (req.user.parent) {
        await checkGeofences(req, latitude, longitude);
      }

      // Emit socket event to parent
      const io = req.app.get("io");
      if (io && req.user.parent) {
        io.to(`parent_${req.user.parent}`).emit("locationUpdate", {
          childId: req.user._id,
          location: {
            latitude,
            longitude,
            accuracy,
            timestamp: location.timestamp,
            address,
          },
        });
      }

      res.json({
        success: true,
        location,
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

// Check if location crosses any geofences
async function checkGeofences(req, latitude, longitude) {
  try {
    const geofences = await Geofence.find({
      children: req.user._id,
      isActive: true,
    });

    for (const geofence of geofences) {
      const isInside = geofence.containsPoint(latitude, longitude);
      const wasInside = req.user.currentLocation
        ? geofence.containsPoint(
            req.user.currentLocation.latitude,
            req.user.currentLocation.longitude,
          )
        : null;

      // Entry event
      if (isInside && wasInside === false && geofence.notifyOnEntry) {
        await createGeofenceAlert(
          req,
          geofence,
          "geofence_entry",
          latitude,
          longitude,
        );
      }

      // Exit event
      if (!isInside && wasInside === true && geofence.notifyOnExit) {
        await createGeofenceAlert(
          req,
          geofence,
          "geofence_exit",
          latitude,
          longitude,
        );
      }
    }
  } catch (error) {
    console.error("Geofence check error:", error);
  }
}

async function createGeofenceAlert(req, geofence, type, latitude, longitude) {
  const isEntry = type === "geofence_entry";

  const alert = await Alert.create({
    type,
    priority: "medium",
    title: isEntry ? `Entered ${geofence.name}` : `Left ${geofence.name}`,
    message: `${req.user.name} has ${isEntry ? "entered" : "left"} the ${geofence.name} area`,
    child: req.user._id,
    parent: req.user.parent,
    geofence: geofence._id,
    location: { latitude, longitude },
  });

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`parent_${req.user.parent}`).emit("alert", {
      type,
      alert,
      childId: req.user._id,
      geofence: { id: geofence._id, name: geofence.name },
    });
  }
}

// @route   GET /api/locations/current/:childId
// @desc    Get child's current location
// @access  Private (Parent only)
router.get(
  "/current/:childId",
  protect,
  authorize("parent"),
  isParentOfChild,
  async (req, res) => {
    try {
      const child = await User.findById(req.params.childId).select(
        "name currentLocation deviceInfo",
      );

      res.json({
        success: true,
        child: {
          id: child._id,
          name: child.name,
          location: child.currentLocation,
          deviceInfo: child.deviceInfo,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   GET /api/locations/history/:childId
// @desc    Get child's location history
// @access  Private (Parent only)
router.get(
  "/history/:childId",
  [protect, authorize("parent"), isParentOfChild],
  async (req, res) => {
    try {
      const { startDate, endDate, limit = 100 } = req.query;

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const locations = await Location.getHistory(
        req.params.childId,
        start,
        end,
        parseInt(limit),
      );

      res.json({
        success: true,
        count: locations.length,
        locations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   GET /api/locations/all-children
// @desc    Get current location of all children
// @access  Private (Parent only)
router.get("/all-children", protect, authorize("parent"), async (req, res) => {
  try {
    const children = await User.find({ parent: req.user._id }).select(
      "name avatar currentLocation deviceInfo",
    );

    res.json({
      success: true,
      children,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

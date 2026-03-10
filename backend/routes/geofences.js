const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const Geofence = require("../models/Geofence");
const User = require("../models/User");

// @route   GET /api/geofences
// @desc    Get all geofences for parent
// @access  Private (Parent only)
router.get("/", protect, authorize("parent"), async (req, res) => {
  try {
    const geofences = await Geofence.find({ parent: req.user._id }).populate(
      "children",
      "name avatar",
    );

    res.json({
      success: true,
      count: geofences.length,
      geofences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/geofences
// @desc    Create a new geofence
// @access  Private (Parent only)
router.post(
  "/",
  [
    protect,
    authorize("parent"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("center.latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    body("center.longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
    body("radius")
      .isInt({ min: 50, max: 10000 })
      .withMessage("Radius must be between 50 and 10000 meters"),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        name,
        type,
        center,
        radius,
        address,
        color,
        children,
        notifyOnEntry,
        notifyOnExit,
        activeHours,
      } = req.body;

      // Validate that children belong to this parent
      if (children && children.length > 0) {
        const validChildren = await User.find({
          _id: { $in: children },
          parent: req.user._id,
        });

        if (validChildren.length !== children.length) {
          return res.status(400).json({
            success: false,
            message: "Invalid child ID(s) provided",
          });
        }
      }

      const geofence = await Geofence.create({
        name,
        type: type || "custom",
        parent: req.user._id,
        center,
        radius,
        address,
        color,
        children: children || [],
        notifyOnEntry: notifyOnEntry !== false,
        notifyOnExit: notifyOnExit !== false,
        activeHours,
      });

      const populatedGeofence = await Geofence.findById(geofence._id).populate(
        "children",
        "name avatar",
      );

      res.status(201).json({
        success: true,
        geofence: populatedGeofence,
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

// @route   GET /api/geofences/:id
// @desc    Get single geofence
// @access  Private (Parent only)
router.get("/:id", protect, authorize("parent"), async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      parent: req.user._id,
    }).populate("children", "name avatar");

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    res.json({
      success: true,
      geofence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/geofences/:id
// @desc    Update geofence
// @access  Private (Parent only)
router.put("/:id", protect, authorize("parent"), async (req, res) => {
  try {
    let geofence = await Geofence.findOne({
      _id: req.params.id,
      parent: req.user._id,
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    const {
      name,
      type,
      center,
      radius,
      address,
      color,
      children,
      notifyOnEntry,
      notifyOnExit,
      activeHours,
      isActive,
    } = req.body;

    // Validate children if provided
    if (children) {
      const validChildren = await User.find({
        _id: { $in: children },
        parent: req.user._id,
      });

      if (validChildren.length !== children.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid child ID(s) provided",
        });
      }
    }

    geofence = await Geofence.findByIdAndUpdate(
      req.params.id,
      {
        name: name || geofence.name,
        type: type || geofence.type,
        center: center || geofence.center,
        radius: radius || geofence.radius,
        address: address !== undefined ? address : geofence.address,
        color: color || geofence.color,
        children: children || geofence.children,
        notifyOnEntry:
          notifyOnEntry !== undefined ? notifyOnEntry : geofence.notifyOnEntry,
        notifyOnExit:
          notifyOnExit !== undefined ? notifyOnExit : geofence.notifyOnExit,
        activeHours: activeHours || geofence.activeHours,
        isActive: isActive !== undefined ? isActive : geofence.isActive,
      },
      { new: true },
    ).populate("children", "name avatar");

    res.json({
      success: true,
      geofence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/geofences/:id
// @desc    Delete geofence
// @access  Private (Parent only)
router.delete("/:id", protect, authorize("parent"), async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      parent: req.user._id,
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    await geofence.deleteOne();

    res.json({
      success: true,
      message: "Geofence deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/geofences/:id/toggle
// @desc    Toggle geofence active status
// @access  Private (Parent only)
router.put("/:id/toggle", protect, authorize("parent"), async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      parent: req.user._id,
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: "Geofence not found",
      });
    }

    geofence.isActive = !geofence.isActive;
    await geofence.save();

    res.json({
      success: true,
      geofence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect, authorize, isParentOfChild } = require("../middleware/auth");
const User = require("../models/User");

// @route   GET /api/children
// @desc    Get all children for parent
// @access  Private (Parent only)
router.get("/", protect, authorize("parent"), async (req, res) => {
  try {
    const children = await User.find({ parent: req.user._id }).select(
      "name email avatar deviceInfo currentLocation settings createdAt",
    );

    res.json({
      success: true,
      count: children.length,
      children,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/children/link
// @desc    Link a child account using link code
// @access  Private (Parent only)
router.post(
  "/link",
  [
    protect,
    authorize("parent"),
    body("linkCode").trim().notEmpty().withMessage("Link code is required"),
    validate,
  ],
  async (req, res) => {
    try {
      const { linkCode } = req.body;

      // Find child by link code
      const child = await User.findOne({
        linkCode: linkCode.toUpperCase(),
        role: "child",
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          message: "Invalid link code",
        });
      }

      // Check if already linked
      if (child.parent) {
        return res.status(400).json({
          success: false,
          message: "This child account is already linked to a parent",
        });
      }

      // Link child to parent
      child.parent = req.user._id;
      await child.save();

      // Add child to parent's children array
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { children: child._id },
      });

      res.json({
        success: true,
        message: "Child account linked successfully",
        child: {
          id: child._id,
          name: child.name,
          email: child.email,
          avatar: child.avatar,
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

// @route   POST /api/children/create
// @desc    Create a child account directly
// @access  Private (Parent only)
router.post(
  "/create",
  [
    protect,
    authorize("parent"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if email exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Create child account
      const child = await User.create({
        name,
        email,
        password,
        role: "child",
        parent: req.user._id,
      });

      // Add child to parent's children array
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { children: child._id },
      });

      res.status(201).json({
        success: true,
        message: "Child account created successfully",
        child: {
          id: child._id,
          name: child.name,
          email: child.email,
          linkCode: child.linkCode,
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

// @route   GET /api/children/:childId
// @desc    Get specific child details
// @access  Private (Parent only)
router.get(
  "/:childId",
  protect,
  authorize("parent"),
  isParentOfChild,
  async (req, res) => {
    try {
      const child = await User.findById(req.params.childId).select("-password");

      res.json({
        success: true,
        child,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   PUT /api/children/:childId/settings
// @desc    Update child settings (by parent)
// @access  Private (Parent only)
router.put(
  "/:childId/settings",
  [protect, authorize("parent"), isParentOfChild],
  async (req, res) => {
    try {
      const { settings } = req.body;

      const child = await User.findByIdAndUpdate(
        req.params.childId,
        { settings: { ...req.child.settings, ...settings } },
        { new: true },
      );

      res.json({
        success: true,
        settings: child.settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// @route   DELETE /api/children/:childId/unlink
// @desc    Unlink child account
// @access  Private (Parent only)
router.delete(
  "/:childId/unlink",
  protect,
  authorize("parent"),
  isParentOfChild,
  async (req, res) => {
    try {
      // Remove parent from child
      await User.findByIdAndUpdate(req.params.childId, {
        parent: null,
      });

      // Remove child from parent's children array
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { children: req.params.childId },
      });

      res.json({
        success: true,
        message: "Child account unlinked successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

module.exports = router;

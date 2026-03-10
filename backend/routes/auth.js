const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["parent", "child"])
      .withMessage("Role must be parent or child"),
    validate,
  ],
  async (req, res) => {
    try {
      const { name, email, password, role, phone } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
      });

      // Generate token
      const token = user.getSignedJwtToken();

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          linkCode: user.linkCode,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  },
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check for user
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update online status
      user.deviceInfo.isOnline = true;
      user.deviceInfo.lastSeen = new Date();
      await user.save();

      // Generate token
      const token = user.getSignedJwtToken();

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          linkCode: user.linkCode,
          children: user.children,
          parent: user.parent,
          settings: user.settings,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  },
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate(
        "children",
        "name email avatar deviceInfo currentLocation settings",
      )
      .populate("parent", "name email avatar");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", protect, async (req, res) => {
  try {
    // Update online status
    req.user.deviceInfo.isOnline = false;
    req.user.deviceInfo.lastSeen = new Date();
    await req.user.save();

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
});

// @route   PUT /api/auth/password
// @desc    Update password
// @access  Private
router.put(
  "/password",
  [
    protect,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
    validate,
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("+password");

      // Check current password
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = req.body.newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password updated successfully",
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

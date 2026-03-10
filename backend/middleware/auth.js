const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is parent of child
exports.isParentOfChild = async (req, res, next) => {
  const childId = req.params.childId || req.body.childId;

  if (!childId) {
    return res.status(400).json({
      success: false,
      message: "Child ID is required",
    });
  }

  try {
    const child = await User.findById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    if (child.role !== "child") {
      return res.status(400).json({
        success: false,
        message: "Specified user is not a child account",
      });
    }

    // Check if parent owns this child
    if (child.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this child's data",
      });
    }

    req.child = child;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying parent-child relationship",
    });
  }
};

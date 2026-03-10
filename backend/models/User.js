const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["parent", "child", "admin"],
      default: "parent",
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    // For child accounts - reference to parent
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // For parent accounts - array of children
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Child account link code (for parent to add child)
    linkCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Device information (mainly for child)
    deviceInfo: {
      batteryLevel: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      isOnline: {
        type: Boolean,
        default: false,
      },
      lastSeen: {
        type: Date,
        default: Date.now,
      },
      deviceType: {
        type: String,
        default: "unknown",
      },
    },
    // Current location (for quick access)
    currentLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date,
      address: String,
    },
    // Settings
    settings: {
      locationSharing: {
        type: Boolean,
        default: true,
      },
      sosEnabled: {
        type: Boolean,
        default: true,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      locationUpdateInterval: {
        type: Number,
        default: 30, // seconds
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Generate link code for child accounts
userSchema.pre("save", function (next) {
  if (this.isNew && this.role === "child" && !this.linkCode) {
    this.linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

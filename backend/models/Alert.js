const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "sos",
        "geofence_entry",
        "geofence_exit",
        "battery_low",
        "offline",
        "online",
        "speed_alert",
        "custom",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    // The child who triggered the alert
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The parent who should receive the alert
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Related geofence (if applicable)
    geofence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Geofence",
      default: null,
    },
    // Location at time of alert
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    // Additional data
    metadata: {
      batteryLevel: Number,
      previousLocation: {
        latitude: Number,
        longitude: Number,
      },
      deviceInfo: String,
    },
    // SOS images (camera captures)
    images: {
      frontCamera: {
        filename: String,
        path: String,
        capturedAt: Date,
      },
      backCamera: {
        filename: String,
        path: String,
        capturedAt: Date,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
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

// Indexes for efficient querying
alertSchema.index({ parent: 1, createdAt: -1 });
alertSchema.index({ child: 1, createdAt: -1 });
alertSchema.index({ isRead: 1 });
alertSchema.index({ type: 1 });

// Static method to get unread count
alertSchema.statics.getUnreadCount = async function (parentId) {
  return this.countDocuments({ parent: parentId, isRead: false });
};

// Static method to get recent alerts
alertSchema.statics.getRecent = async function (parentId, limit = 20) {
  return this.find({ parent: parentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("child", "name avatar")
    .populate("geofence", "name type");
};

module.exports = mongoose.model("Alert", alertSchema);

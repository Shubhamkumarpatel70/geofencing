const mongoose = require("mongoose");

const geofenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for the geofence"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    type: {
      type: String,
      enum: [
        "home",
        "school",
        "tuition",
        "playground",
        "relative",
        "restricted",
        "custom",
      ],
      default: "custom",
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Children this geofence applies to
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Circle geofence
    center: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    radius: {
      type: Number,
      required: true,
      min: 50,
      max: 10000,
      default: 200, // meters
    },
    address: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#2563EB",
    },
    // Notification settings
    notifyOnEntry: {
      type: Boolean,
      default: true,
    },
    notifyOnExit: {
      type: Boolean,
      default: true,
    },
    // Active hours (optional)
    activeHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "00:00",
      },
      endTime: {
        type: String,
        default: "23:59",
      },
      days: {
        type: [Number], // 0-6 (Sunday-Saturday)
        default: [0, 1, 2, 3, 4, 5, 6],
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

// Index for efficient querying
geofenceSchema.index({ parent: 1 });
geofenceSchema.index({ children: 1 });

// Method to check if a point is inside the geofence
geofenceSchema.methods.containsPoint = function (latitude, longitude) {
  const distance = this.getDistanceFromCenter(latitude, longitude);
  return distance <= this.radius;
};

// Calculate distance from center (Haversine formula)
geofenceSchema.methods.getDistanceFromCenter = function (latitude, longitude) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (this.center.latitude * Math.PI) / 180;
  const φ2 = (latitude * Math.PI) / 180;
  const Δφ = ((latitude - this.center.latitude) * Math.PI) / 180;
  const Δλ = ((longitude - this.center.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

module.exports = mongoose.model("Geofence", geofenceSchema);

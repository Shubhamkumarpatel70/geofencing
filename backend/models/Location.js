const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: -180,
      max: 180,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    altitude: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
locationSchema.index({ user: 1, timestamp: -1 });
locationSchema.index({ timestamp: -1 });

// Static method to get location history
locationSchema.statics.getHistory = async function (
  userId,
  startDate,
  endDate,
  limit = 100,
) {
  const query = { user: userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 }).limit(limit);
};

// Static method to get latest location
locationSchema.statics.getLatest = async function (userId) {
  return this.findOne({ user: userId }).sort({ timestamp: -1 });
};

module.exports = mongoose.model("Location", locationSchema);

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.name} (${user.role})`);

    // Join room based on role
    if (user.role === "parent") {
      socket.join(`parent_${user._id}`);
      console.log(`Parent ${user.name} joined room: parent_${user._id}`);
    } else if (user.role === "child") {
      socket.join(`child_${user._id}`);
      console.log(`Child ${user.name} joined room: child_${user._id}`);

      // Join parent's room to receive broadcasts
      if (user.parent) {
        socket.join(`parent_${user.parent}_children`);
      }
    }

    // Update online status
    updateOnlineStatus(user._id, true);

    // Handle location updates from child
    socket.on("updateLocation", async (data) => {
      if (user.role !== "child") return;

      try {
        const { latitude, longitude, accuracy, speed, heading, address } = data;

        // Update current location
        await User.findByIdAndUpdate(user._id, {
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

        // Emit to parent
        if (user.parent) {
          io.to(`parent_${user.parent}`).emit("locationUpdate", {
            childId: user._id,
            childName: user.name,
            location: {
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              address,
              timestamp: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Location update error:", error);
      }
    });

    // Handle battery level updates from child
    socket.on("updateBatteryLevel", async (data) => {
      if (user.role !== "child") return;

      try {
        const { batteryLevel } = data;

        await User.findByIdAndUpdate(user._id, {
          "deviceInfo.batteryLevel": batteryLevel,
          "deviceInfo.lastSeen": new Date(),
        });

        // Emit to parent
        if (user.parent) {
          io.to(`parent_${user.parent}`).emit("batteryUpdate", {
            childId: user._id,
            batteryLevel,
          });
        }
      } catch (error) {
        console.error("Battery update error:", error);
      }
    });

    // Handle SOS trigger from child
    socket.on("triggerSOS", async (data) => {
      if (user.role !== "child") return;

      try {
        const Alert = require("../models/Alert");
        const { latitude, longitude, address, message } = data;

        const alert = await Alert.create({
          type: "sos",
          priority: "critical",
          title: "SOS Emergency Alert!",
          message:
            message || `${user.name} has triggered an emergency SOS alert!`,
          child: user._id,
          parent: user.parent,
          location: { latitude, longitude, address },
        });

        // Emit to parent
        if (user.parent) {
          io.to(`parent_${user.parent}`).emit("sos", {
            alert,
            child: {
              id: user._id,
              name: user.name,
            },
          });
        }

        // Confirm to child
        socket.emit("sosConfirmed", { alertId: alert._id });
      } catch (error) {
        console.error("SOS trigger error:", error);
        socket.emit("sosError", { message: "Failed to send SOS" });
      }
    });

    // Parent requests child's location
    socket.on("requestChildLocation", async (data) => {
      if (user.role !== "parent") return;

      const { childId } = data;
      io.to(`child_${childId}`).emit("locationRequested", {
        parentId: user._id,
      });
    });

    // Parent subscribes to a child's updates
    socket.on("subscribeToChild", async (data) => {
      if (user.role !== "parent") return;

      const { childId } = data;

      // Verify parent-child relationship
      const child = await User.findOne({ _id: childId, parent: user._id });
      if (child) {
        socket.join(`child_${childId}_updates`);
        socket.emit("subscribedToChild", { childId, success: true });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${user.name}`);

      // Update online status
      await updateOnlineStatus(user._id, false);

      // Notify parent if child goes offline
      if (user.role === "child" && user.parent) {
        io.to(`parent_${user.parent}`).emit("childOffline", {
          childId: user._id,
          childName: user.name,
          lastSeen: new Date(),
        });
      }
    });
  });

  return io;
};

async function updateOnlineStatus(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, {
      "deviceInfo.isOnline": isOnline,
      "deviceInfo.lastSeen": new Date(),
    });
  } catch (error) {
    console.error("Failed to update online status:", error);
  }
}

module.exports = initializeSocket;

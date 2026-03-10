require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Location = require("../models/Location");
const Geofence = require("../models/Geofence");
const Alert = require("../models/Alert");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Location.deleteMany({});
    await Geofence.deleteMany({});
    await Alert.deleteMany({});

    console.log("Creating users...");

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      phone: "+1 555-0000",
      avatar: "",
      deviceInfo: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    // Create parent user
    const parent = await User.create({
      name: "John Smith",
      email: "parent@example.com",
      password: "password123",
      role: "parent",
      phone: "+1 555-0100",
      avatar: "",
      deviceInfo: {
        isOnline: true,
        lastSeen: new Date(),
      },
      settings: {
        notificationsEnabled: true,
      },
    });

    // Create child users
    const child1 = await User.create({
      name: "Emma Smith",
      email: "emma@example.com",
      password: "password123",
      role: "child",
      parent: parent._id,
      avatar: "",
      deviceInfo: {
        batteryLevel: 75,
        isOnline: true,
        lastSeen: new Date(),
        deviceType: "iPhone",
      },
      currentLocation: {
        latitude: 28.6289,
        longitude: 77.2074,
        accuracy: 10,
        timestamp: new Date(),
        address: "Connaught Place, New Delhi, India",
      },
      settings: {
        locationSharing: true,
        sosEnabled: true,
      },
    });

    const child2 = await User.create({
      name: "Lucas Smith",
      email: "lucas@example.com",
      password: "password123",
      role: "child",
      parent: parent._id,
      avatar: "",
      deviceInfo: {
        batteryLevel: 45,
        isOnline: false,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        deviceType: "Android",
      },
      currentLocation: {
        latitude: 28.5672,
        longitude: 77.21,
        accuracy: 15,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        address: "Saket, New Delhi, India",
      },
      settings: {
        locationSharing: true,
        sosEnabled: true,
      },
    });

    // Update parent with children
    await User.findByIdAndUpdate(parent._id, {
      $push: { children: { $each: [child1._id, child2._id] } },
    });

    console.log("Creating geofences...");

    // Create geofences
    const homeGeofence = await Geofence.create({
      name: "Home",
      type: "home",
      parent: parent._id,
      children: [child1._id, child2._id],
      center: {
        latitude: 28.6289,
        longitude: 77.2074,
      },
      radius: 200,
      address: "Connaught Place, New Delhi, India",
      color: "#16A34A",
      notifyOnEntry: true,
      notifyOnExit: true,
    });

    const schoolGeofence = await Geofence.create({
      name: "Delhi Public School",
      type: "school",
      parent: parent._id,
      children: [child1._id, child2._id],
      center: {
        latitude: 28.5672,
        longitude: 77.21,
      },
      radius: 300,
      address: "Mathura Road, New Delhi, India",
      color: "#2563EB",
      notifyOnEntry: true,
      notifyOnExit: true,
      activeHours: {
        enabled: true,
        startTime: "07:00",
        endTime: "16:00",
        days: [1, 2, 3, 4, 5], // Monday to Friday
      },
    });

    const tuitionGeofence = await Geofence.create({
      name: "Math Tuition Center",
      type: "tuition",
      parent: parent._id,
      children: [child1._id],
      center: {
        latitude: 28.6514,
        longitude: 77.1907,
      },
      radius: 150,
      address: "Karol Bagh, New Delhi, India",
      color: "#F59E0B",
      notifyOnEntry: true,
      notifyOnExit: true,
    });

    const restrictedGeofence = await Geofence.create({
      name: "Chandni Chowk Area",
      type: "restricted",
      parent: parent._id,
      children: [child1._id, child2._id],
      center: {
        latitude: 28.6506,
        longitude: 77.2309,
      },
      radius: 500,
      address: "Chandni Chowk, Old Delhi, India",
      color: "#DC2626",
      notifyOnEntry: true,
      notifyOnExit: false,
    });

    console.log("Creating location history...");

    // Create location history for child1
    const locationHistory = [];
    const baseTime = Date.now();
    const baseLocations = [
      { lat: 28.6289, lng: 77.2074, addr: "Home" },
      { lat: 28.615, lng: 77.21, addr: "En route" },
      { lat: 28.6, lng: 77.21, addr: "En route" },
      { lat: 28.5672, lng: 77.21, addr: "School" },
      { lat: 28.568, lng: 77.2105, addr: "School" },
      { lat: 28.5672, lng: 77.21, addr: "School" },
    ];

    for (let i = 0; i < baseLocations.length; i++) {
      locationHistory.push({
        user: child1._id,
        latitude: baseLocations[i].lat + (Math.random() * 0.001 - 0.0005),
        longitude: baseLocations[i].lng + (Math.random() * 0.001 - 0.0005),
        accuracy: Math.floor(Math.random() * 20) + 5,
        speed: Math.random() * 10,
        timestamp: new Date(
          baseTime - (baseLocations.length - i) * 30 * 60 * 1000,
        ),
        address: baseLocations[i].addr,
      });
    }

    await Location.insertMany(locationHistory);

    console.log("Creating alerts...");

    // Create sample alerts
    await Alert.create([
      {
        type: "geofence_exit",
        priority: "medium",
        title: "Left Home",
        message: "Emma Smith has left the Home area",
        child: child1._id,
        parent: parent._id,
        geofence: homeGeofence._id,
        location: {
          latitude: 40.714,
          longitude: -74.005,
          address: "Near Home",
        },
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        type: "geofence_entry",
        priority: "medium",
        title: "Arrived at School",
        message: "Emma Smith has arrived at Lincoln High School",
        child: child1._id,
        parent: parent._id,
        geofence: schoolGeofence._id,
        location: {
          latitude: 40.7282,
          longitude: -73.7949,
          address: "Lincoln High School",
        },
        isRead: true,
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
      },
      {
        type: "battery_low",
        priority: "high",
        title: "Low Battery Alert",
        message: "Lucas Smith's device battery is at 15%",
        child: child2._id,
        parent: parent._id,
        metadata: { batteryLevel: 15 },
        isRead: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      },
      {
        type: "offline",
        priority: "medium",
        title: "Device Offline",
        message: "Lucas Smith's device went offline",
        child: child2._id,
        parent: parent._id,
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      },
      {
        type: "geofence_entry",
        priority: "high",
        title: "Entered Restricted Area",
        message: "Lucas Smith has entered the Downtown Area (restricted zone)",
        child: child2._id,
        parent: parent._id,
        geofence: restrictedGeofence._id,
        location: {
          latitude: 40.758,
          longitude: -73.9855,
          address: "Times Square",
        },
        isRead: false,
        createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
      },
    ]);

    // Create another parent with child for additional test data
    const parent2 = await User.create({
      name: "Sarah Johnson",
      email: "sarah@example.com",
      password: "password123",
      role: "parent",
      phone: "+1 555-0200",
      deviceInfo: {
        isOnline: false,
        lastSeen: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    const child3 = await User.create({
      name: "Olivia Johnson",
      email: "olivia@example.com",
      password: "password123",
      role: "child",
      parent: parent2._id,
      deviceInfo: {
        batteryLevel: 92,
        isOnline: true,
        lastSeen: new Date(),
        deviceType: "iPhone",
      },
      currentLocation: {
        latitude: 40.7831,
        longitude: -73.9712,
        accuracy: 8,
        timestamp: new Date(),
        address: "Central Park, New York, NY",
      },
    });

    await User.findByIdAndUpdate(parent2._id, {
      $push: { children: child3._id },
    });

    console.log("\n=== Seed Data Created Successfully ===\n");
    console.log("Test Accounts:");
    console.log("──────────────────────────────────────");
    console.log("Parent Account 1:");
    console.log("  Email: parent@example.com");
    console.log("  Password: password123");
    console.log("  Children: Emma Smith, Lucas Smith");
    console.log("");
    console.log("Parent Account 2:");
    console.log("  Email: sarah@example.com");
    console.log("  Password: password123");
    console.log("  Children: Olivia Johnson");
    console.log("");
    console.log("Child Accounts:");
    console.log(`  Emma (Link Code: ${child1.linkCode})`);
    console.log("    Email: emma@example.com");
    console.log("    Password: password123");
    console.log(`  Lucas (Link Code: ${child2.linkCode})`);
    console.log("    Email: lucas@example.com");
    console.log("    Password: password123");
    console.log(`  Olivia (Link Code: ${child3.linkCode})`);
    console.log("    Email: olivia@example.com");
    console.log("    Password: password123");
    console.log("──────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();

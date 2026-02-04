const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const ParkingSpace = require("../models/ParkingSpace");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Demo Users
const demoUsers = [
  {
    name: "Demo Seeker",
    email: "seeker@demo.com",
    phone: "1234567890",
    password: "demo123",
    role: "seeker",
    isVerified: true,
  },
  {
    name: "Demo Owner",
    email: "owner@demo.com",
    phone: "0987654321",
    password: "demo123",
    role: "owner",
    isVerified: true,
    bio: "Parking space owner with multiple locations",
  },
  {
    name: "Demo Admin",
    email: "admin@demo.com",
    phone: "1112223333",
    password: "admin123",
    role: "admin",
    isVerified: true,
  },
];

// Demo Parking Spaces
const demoParkingSpaces = [
  {
    title: "Downtown Parking Spot",
    description:
      "Convenient parking spot in the heart of downtown. Easy access to shops and restaurants.",
    location: {
      type: "Point",
      coordinates: [-73.985428, 40.748817], // [longitude, latitude]
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
    },
    parkingSize: "sedan",
    pricePerHour: 5,
    pricePerDay: 35,
    amenities: ["covered", "security_camera", "well_lit"],
    availabilitySchedule: {
      monday: { isAvailable: true, start: "06:00", end: "22:00" },
      tuesday: { isAvailable: true, start: "06:00", end: "22:00" },
      wednesday: { isAvailable: true, start: "06:00", end: "22:00" },
      thursday: { isAvailable: true, start: "06:00", end: "22:00" },
      friday: { isAvailable: true, start: "06:00", end: "23:00" },
      saturday: { isAvailable: true, start: "08:00", end: "23:00" },
      sunday: { isAvailable: true, start: "08:00", end: "20:00" },
    },
    status: "available",
    isApproved: true,
  },
  {
    title: "Residential Driveway",
    description:
      "Safe driveway parking in quiet residential area. Perfect for overnight parking.",
    location: {
      type: "Point",
      coordinates: [-73.990428, 40.752817],
      address: "456 Oak Avenue",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10002",
    },
    parkingSize: "suv",
    pricePerHour: 3,
    pricePerDay: 20,
    amenities: ["well_lit", "ev_charging"],
    availabilitySchedule: {
      monday: { isAvailable: true, start: "00:00", end: "23:59" },
      tuesday: { isAvailable: true, start: "00:00", end: "23:59" },
      wednesday: { isAvailable: true, start: "00:00", end: "23:59" },
      thursday: { isAvailable: true, start: "00:00", end: "23:59" },
      friday: { isAvailable: true, start: "00:00", end: "23:59" },
      saturday: { isAvailable: true, start: "00:00", end: "23:59" },
      sunday: { isAvailable: true, start: "00:00", end: "23:59" },
    },
    status: "available",
    isApproved: true,
  },
  {
    title: "Garage Space Near Station",
    description:
      "Covered garage parking near train station. Great for commuters.",
    location: {
      type: "Point",
      coordinates: [-73.980428, 40.745817],
      address: "789 Station Road",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10003",
    },
    parkingSize: "suv",
    pricePerHour: 8,
    pricePerDay: 50,
    amenities: [
      "covered",
      "security_camera",
      "well_lit",
      "handicap_accessible",
    ],
    availabilitySchedule: {
      monday: { isAvailable: true, start: "05:00", end: "23:00" },
      tuesday: { isAvailable: true, start: "05:00", end: "23:00" },
      wednesday: { isAvailable: true, start: "05:00", end: "23:00" },
      thursday: { isAvailable: true, start: "05:00", end: "23:00" },
      friday: { isAvailable: true, start: "05:00", end: "23:00" },
      saturday: { isAvailable: true, start: "06:00", end: "22:00" },
      sunday: { isAvailable: true, start: "06:00", end: "22:00" },
    },
    status: "available",
    isApproved: true,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await ParkingSpace.deleteMany({});

    // Create users - the User model's pre-save hook will hash passwords
    console.log("Creating demo users...");
    const createdUsers = [];
    for (const userData of demoUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    // Find owner user for parking spaces
    const ownerUser = createdUsers.find((u) => u.role === "owner");

    // Create parking spaces
    console.log("\nCreating demo parking spaces...");
    for (const parkingData of demoParkingSpaces) {
      await ParkingSpace.create({
        ...parkingData,
        owner: ownerUser._id,
      });
      console.log(`Created parking: ${parkingData.title}`);
    }

    console.log("\n========================================");
    console.log("Database seeded successfully!");
    console.log("========================================");
    console.log("\nDemo Login Credentials:");
    console.log("----------------------------------------");
    console.log("SEEKER:  seeker@demo.com / demo123");
    console.log("OWNER:   owner@demo.com / demo123");
    console.log("ADMIN:   admin@demo.com / admin123");
    console.log("----------------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();

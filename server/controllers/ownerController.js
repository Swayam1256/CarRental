import imageKit from "../config/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";

import jwt from "jsonwebtoken";

// Helper to generate token (if you have separate util file, import that)
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// API to change user role to owner

export const changeRoleToOwner = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Missing user info" });
    }

    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== "owner") {
      user.role = "owner";
      await user.save();
    }

    // Generate new token so role change is reflected
    const token = generateToken(user._id);

    res
      .status(200)
      .json({ success: true, message: "Role updated to owner", token, user });
  } catch (error) {
    console.error("Role update error:", error.message || error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// API to List Car
export const addCar = async (req, res) => {
  try {
    // Get logged-in user ID
    const { _id } = req.user;

    // Parse incoming car data
    const car = JSON.parse(req.body.carData);
    const imageFile = req.file;

    if (!car.brand || !car.model || !car.pricePerDay) {
      return res.json({
        success: false,
        message: "Brand, model, and price per day are required.",
      });
    }

    // ✅ Upload image to ImageKit
    const fileBuffer = fs.readFileSync(imageFile.path);
    const uploadResponse = await imageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/cars",
    });

    // ✅ Auto-generate car name safely
    const name = car.name?.trim() || `${car.brand} ${car.model}`.trim();
    if (!name) {
      return res.json({
        success: false,
        message:
          "Car name could not be generated. Please provide brand and model.",
      });
    }

    // ✅ Create new car in DB
    const newCar = await Car.create({
      name,
      brand: car.brand,
      model: car.model,
      pricePerDay: car.pricePerDay,
      category: car.category || "Standard",
      year: car.year || new Date().getFullYear(),
      fuel_type: car.fuel_type || "Petrol",
      transmission: car.transmission || "Manual",
      seating_capacity: car.seating_capacity || 4,
      location: car.location || "Not specified",
      description: car.description || "",
      featured: car.featured || false,
      owner: _id, // ✅ Assign owner ID
      image: uploadResponse.url,
    });

    // ✅ Success response
    res.json({
      success: true,
      message: "Car added successfully!",
      car: newCar,
    });
  } catch (error) {
    console.error("❌ addCar error:", error.message || error);
    res.json({
      success: false,
      message: error.message || "Something went wrong while adding the car.",
    });
  }
};

// API to List Owner Cars
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    res.json({ success: true, cars });
  } catch (error) {
    console.log(error.message || error);
    res.json({ success: false, message: error.message });
  }
};

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking if the car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.isAvailable = !car.isAvailable;
    await car.save();

    res.json({ success: true, message: "Availability Toggled" });
  } catch (error) {
    console.log(error.message || error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a car
export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking if the car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.owner = null;
    car.isAvailable = false;
    await car.save();

    res.json({ success: true, message: "Car Removed" });
  } catch (error) {
    console.log(error.message || error);
    res.json({ success: false, message: error.message });
  }
};

// API to get Dashboard Data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;
    console.log("User role:", role);

    // Role check
    if (role !== "owner") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Owner only" });
    }

    // Fetch cars owned by the user
    const cars = await Car.find({ owner: _id });

    // Fetch bookings with populated car data and sorted by creation date
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    // Filter out bookings with missing car references
    const validBookings = bookings.filter((b) => b.car);

    // Count bookings by status
    const pendingBookings = validBookings.filter(
      (b) => b.status === "pending"
    ).length;
    const completedBookings = validBookings.filter(
      (b) => b.status === "confirmed"
    ).length;

    // Calculate monthly revenue from confirmed bookings
    const monthlyRevenue = validBookings
      .filter((b) => b.status === "confirmed" && typeof b.price === "number")
      .reduce((acc, b) => acc + b.price, 0);

    // Sanitize revenue to avoid NaN
    const safeRevenue = isNaN(monthlyRevenue) ? 0 : monthlyRevenue;

    // Prepare dashboard data
    const dashboardData = {
      totalCars: cars.length,
      totalBookings: validBookings.length,
      pendingBookings,
      completedBookings,
      recentBookings: validBookings.slice(0, 3),
      monthlyRevenue: safeRevenue,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error("Dashboard error:", error.message || error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// API to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;

    if (!imageFile) {
      return res.json({ success: false, message: "No image provided" });
    }

    // Upload image to ImageKit
    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });

    // Optimize with ImageKit transformation
    const optimizedImageUrl = imageKit.url({
      path: response.filePath,
      transformation: [
        { width: "400" },
        { quality: "auto" },
        { format: "webp" },
      ],
    });

    // Update user and return updated doc
    const user = await User.findByIdAndUpdate(
      _id,
      { image: optimizedImageUrl },
      { new: true }
    );

    // Generate a fresh token with updated info
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Profile image updated successfully",
      user,
      token, // ✅ return new token
    });
  } catch (error) {
    console.error("updateUserImage error:", error.message || error);
    res.json({ success: false, message: error.message });
  }
};

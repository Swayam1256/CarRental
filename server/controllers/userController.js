import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Car from "../models/Car.js"; // if used for getCars

// Generate JWT Token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // expires in 1 hour
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields and ensure password ≥ 8 chars",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user", // default role
    });

    const token = generateToken(user._id.toString());

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("registerUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ success: false, message: "User not found" });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  const token = generateToken(user._id.toString());
  return res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // should be "user" by default
    },
  });
};

// Get user data via token
export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image, // ✅ include image
      },
    });
  } catch (error) {
    console.error("getUserData error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to ensure full image URL
const ensureFullImageUrl = (imagePath) => {
  if (!imagePath) return "/no-image.png"; // fallback image
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.IMAGEKIT_URL_ENDPOINT.replace(
    /\/$/,
    ""
  )}/${imagePath.replace(/\\/g, "/")}`;
};

// ✅ Get all available cars (works when logged out too)
export const getCars = async (req, res) => {
  try {
    const cars = await Car.find({ isAvailable: true })
      .populate("owner", "name email image")
      .sort({ createdAt: -1 });

    // Remove duplicates and format images
    const uniqueCars = Array.from(
      new Map(cars.map((car) => [car._id.toString(), car])).values()
    ).map((car) => {
      const carObj = car.toObject();
      carObj.image = ensureFullImageUrl(car.image);
      if (carObj.owner?.image) {
        carObj.owner.image = ensureFullImageUrl(carObj.owner.image);
      }
      return carObj;
    });

    res.status(200).json({ success: true, cars: uniqueCars });
  } catch (error) {
    console.error("getCars error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedCars = async (req, res) => {
  try {
    // Try to get cars explicitly marked as featured
    let cars = await Car.find({ isAvailable: true, featured: true })
      .populate("owner", "name email image")
      .sort({ createdAt: -1 });

    // Remove duplicates and fix image URLs
    let uniqueCars = Array.from(
      new Map(cars.map((car) => [car._id.toString(), car])).values()
    ).map((car) => {
      const carObj = car.toObject();
      carObj.image = ensureFullImageUrl(car.image);
      if (carObj.owner?.image)
        carObj.owner.image = ensureFullImageUrl(carObj.owner.image);
      return carObj;
    });

    // If no featured cars exist, fallback to random available cars (up to 6)
    if (uniqueCars.length === 0) {
      const fallbackCars = await Car.find({ isAvailable: true })
        .limit(6)
        .populate("owner", "name email image");
      uniqueCars = fallbackCars.map((car) => {
        const carObj = car.toObject();
        carObj.image = ensureFullImageUrl(car.image);
        if (carObj.owner?.image)
          carObj.owner.image = ensureFullImageUrl(carObj.owner.image);
        return carObj;
      });
    }

    res.status(200).json({ success: true, cars: uniqueCars });
  } catch (error) {
    console.error("getFeaturedCars error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Change user role to owner (when user clicks “List Cars”)
export const changeUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== "owner") {
      user.role = "owner";
      await user.save();
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Role updated to owner",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("changeUserRole error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

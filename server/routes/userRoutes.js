

import express from "express";
import {
  registerUser,
  loginUser,
  getUserData,
  getCars,
  getFeaturedCars, // ✅ make sure this matches exactly
  changeUserRole,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/cars", getCars);
userRouter.get("/cars/featured", getFeaturedCars); // ✅ added

// Protected routes
userRouter.get("/data", protect, getUserData);
userRouter.post("/change-role", protect, changeUserRole);

export default userRouter;

import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  category: { type: String, default: "Standard" },
  fuel_type: { type: String, default: "Petrol" },
  transmission: { type: String, default: "Manual" },
  seating_capacity: { type: Number, default: 4 },
  location: { type: String, default: "Not specified" },
  description: { type: String, default: "" },
  pricePerDay: { type: Number, required: true },
  image: { type: String, default: "" },
  isAvailable: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const Car = mongoose.model("Car", carSchema);
export default Car;

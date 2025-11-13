import Booking from "../models/Booking.js";
import Car from "../models/Car.js";

const ensureFullImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, "")}/${imagePath.replace(/\\/g, "/")}`;
};

// ✅ Helper to check car availability
const checkAvailability = async (car, pickupDate, returnDate) => {
  const bookings = await Booking.find({
    car,
    pickupDate: { $lte: returnDate },
    returnDate: { $gte: pickupDate },
  });
  return true;
};

// ✅ Check available cars for given dates and location
export const checkCarAvailability = async (req, res) => {
  try {
    const { location, pickupDate, returnDate } = req.body;

    const cars = await Car.find({ location, isAvailable: true });

    const availableCarsPromises = cars.map(async (car) => {
      const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
      return { ...car.toObject(), isAvailable };
    });

    const allCars = await Promise.all(availableCarsPromises);
    const availableCars = allCars.filter((car) => car.isAvailable === true);

    res.json({ success: true, availableCars });
  } catch (error) {
    console.error("checkCarAvailability error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create Booking
export const createBooking = async (req, res) => {
  try {
    const { _id } = req.user;
    const { car, pickupDate, returnDate } = req.body;

    const isAvailable = await checkAvailability(car, pickupDate, returnDate);
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: "Car is not available for these dates" });
    }

    const carData = await Car.findById(car);
    if (!carData) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const noOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const price = carData.pricePerDay * noOfDays;

    await Booking.create({
      car,
      owner: carData.owner,
      user: _id,
      pickupDate,
      returnDate,
      price,
    });

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.error("createBooking error:", error.message);
    res.status(500).json({ success: false, message: "Booking creation failed" });
  }
};

// ✅ Get User Bookings (always returns valid full image URL)
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: "car",
        select: "name brand model image pricePerDay location year category",
      })
      .sort({ createdAt: -1 });

    const updatedBookings = bookings.map((booking) => {
      const car = booking.car?.toObject?.() || {};
      car.image = ensureFullImageUrl(car.image);
      return { ...booking.toObject(), car };
    });

    res.json({ success: true, bookings: updatedBookings });
  } catch (error) {
    console.error("getUserBookings error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch user bookings" });
  }
};

// ✅ Get Owner Bookings (car + user image fixes)
export const getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate({
        path: "car",
        select: "name brand model image pricePerDay location year category",
      })
      .populate({
        path: "user",
        select: "name email image",
      })
      .sort({ createdAt: -1 });

    const updatedBookings = bookings.map((booking) => {
      const car = booking.car?.toObject?.() || {};
      const user = booking.user?.toObject?.() || {};

      car.image = ensureFullImageUrl(car.image);
      user.image = ensureFullImageUrl(user.image);

      return { ...booking.toObject(), car, user };
    });

    res.json({ success: true, bookings: updatedBookings });
  } catch (error) {
    console.error("getOwnerBookings error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch owner bookings" });
  }
};

// ✅ Change Booking Status
export const changeBookingStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId, status } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.owner.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, message: "Booking status updated" });
  } catch (error) {
    console.error("changeBookingStatus error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

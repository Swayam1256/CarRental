
import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema({
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: "Pickup date must be in the future"
    }
  },
  returnDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.pickupDate;
      },
      message: "Return date must be after pickup date"
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price must be a positive number"]
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
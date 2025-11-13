import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

const MyBookings = () => {
  const { axios, user, currency, token } = useAppContext();
  const [bookings, setBookings] = useState([]);

  // ✅ Fetch user's bookings with token auth
  const fetchMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/bookings/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchMyBookings();
    }
  }, [user, token]);

  // ✅ Helper to safely render image (handles relative paths too)
  const getImageUrl = (image) => {
    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
    if (!image) return assets.car_placeholder;
    if (image.startsWith("http")) return image;
    if (endpoint)
      return `${endpoint.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
    return assets.car_placeholder;
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl"
    >
      <br />
      <br />
      <Title
        title="My Bookings"
        subTitle="View and manage all your car bookings"
        align="left"
      />

      {/* ✅ Handle case when there are no bookings */}
      {bookings.length === 0 ? (
        <p className="text-gray-500 mt-10">No bookings found.</p>
      ) : (
        <div>
          {bookings.map((booking, index) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-12"
            >
              {/* Car Info */}
              <div className="md:col-span-1">
                <div className="rounded-md overflow-hidden mb-3">
                  <img
                    src={getImageUrl(booking.car?.image)}
                    alt={booking.car?.name || "Car"}
                    className="w-full h-auto aspect-video object-cover"
                    onError={(e) => (e.target.src = assets.car_placeholder)}
                  />
                </div>
                <p className="text-lg font-medium mt-2">
                  {booking.car?.brand} {booking.car?.model}
                </p>
                <p className="text-gray-500">
                  {booking.car?.year} · {booking.car?.category} ·{" "}
                  {booking.car?.location}
                </p>
              </div>

              {/* Booking Info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <p className="px-3 py-1.5 bg-light rounded">
                    Booking #{index + 1}
                  </p>
                  <p
                    className={`px-3 py-1 text-xs rounded-full ${
                      booking.status === "confirmed"
                        ? "bg-green-400/15 text-green-600"
                        : booking.status === "pending"
                        ? "bg-yellow-400/15 text-yellow-600"
                        : booking.status === "cancelled"
                        ? "bg-red-400/15 text-red-600"
                        : "bg-gray-400/15 text-gray-600"
                    }`}
                  >
                    {booking.status}
                  </p>
                </div>

                <div className="flex items-start gap-2 mt-3">
                  <img
                    src={assets.calendar_icon_colored}
                    alt=""
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <p className="text-gray-500">Rental Period</p>
                    <p>
                      {booking.pickupDate.split("T")[0]} →{" "}
                      {booking.returnDate.split("T")[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-3">
                  <img
                    src={assets.location_icon_colored}
                    alt=""
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <p className="text-gray-500">Pick-up Location</p>
                    <p>{booking.car?.location}</p>
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className="md:col-span-1 flex flex-col justify-between gap-6">
                <div className="text-sm text-gray-500 text-right">
                  <p>Total Price</p>
                  <h1 className="text-2xl font-semibold text-primary">
                    {currency}
                    {booking.price}
                  </h1>
                  <p>Booked on {booking.createdAt.split("T")[0]}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyBookings;

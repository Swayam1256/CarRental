import { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY || "USD";

  const [token, _setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [cars, setCars] = useState([]);
  const [featuredCars, setFeaturedCars] = useState([]); // ✅ new state

  const isOwner = user?.role === "owner";

  // ✅ Centralized token setter
  const setToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    }
    _setToken(newToken);
  };

  // ✅ Helper: ensure image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "/no-image.png";
    if (imagePath.startsWith("http")) return imagePath;
    return `${import.meta.env.VITE_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\/+/, "")}`;
  };

  // ✅ Fetch all cars (public)
  const fetchCars = async () => {
    try {
      const { data } = await axios.get("/api/users/cars");
      if (data.success) {
        const uniqueCars = Array.from(
          new Map(data.cars.map((car) => [car._id, car])).values()
        ).map((car) => ({
          ...car,
          image: getFullImageUrl(car.image),
          owner: car.owner ? { ...car.owner, image: getFullImageUrl(car.owner.image) } : null,
        }));
        setCars(uniqueCars);
      }
    } catch (error) {
      console.error("Error fetching cars:", error.message);
    }
  };

  // ✅ Fetch featured cars (public)
  const fetchFeaturedCars = async () => {
    try {
      const { data } = await axios.get("/api/users/cars/featured");
      if (data.success) {
        const uniqueFeatured = Array.from(
          new Map(data.cars.map((car) => [car._id, car])).values()
        ).map((car) => ({
          ...car,
          image: getFullImageUrl(car.image),
          owner: car.owner ? { ...car.owner, image: getFullImageUrl(car.owner.image) } : null,
        }));
        setFeaturedCars(uniqueFeatured);
      }
    } catch (error) {
      console.error("Error fetching featured cars:", error.message);
    }
  };

  // ✅ Fetch logged-in user
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/users/data");
      if (data.success) setUser(data.user);
      else logout();
    } catch (error) {
      logout();
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ Logout
  const logout = (showToast = true) => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoadingUser(false);
    delete axios.defaults.headers.common["Authorization"];
    if (showToast) toast.success("Logged out successfully");
    fetchCars();
    fetchFeaturedCars(); // ✅ fetch featured cars again
    navigate("/");
  };

  // ✅ Token watcher
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) logout();
        else {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          fetchUser();
          fetchCars();
          fetchFeaturedCars(); // ✅ fetch featured cars for logged-in users
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    } else {
      fetchCars();
      fetchFeaturedCars(); // ✅ fetch featured cars for public
      setLoadingUser(false);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      navigate,
      currency,
      axios,
      user,
      setUser,
      token,
      setToken,
      isOwner,
      fetchUser,
      loadingUser,
      showLogin,
      setShowLogin,
      logout,
      fetchCars,
      cars,
      setCars,
      featuredCars, // ✅ exposed featured cars
      pickupDate,
      setPickupDate,
      returnDate,
      setReturnDate,
    }),
    [navigate, currency, user, token, isOwner, loadingUser, showLogin, cars, featuredCars, pickupDate, returnDate]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

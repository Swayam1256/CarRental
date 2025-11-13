

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets, menuLinks } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {motion} from 'motion/react';

const Navbar = () => {
  const { setShowLogin, user, setUser, logout, axios } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [search, setSearch] = useState("");

  const isOwner = user?.role === "owner";

  // 🌀 Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  // 🔁 Role change handler
  const changeRole = async () => {
    try {
      setChangingRole(true);
      const { data } = await axios.post("/api/users/change-role");
      if (data.success) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        setUser(data.user);
        toast.success(data.message);
        navigate("/owner");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingRole(false);
    }
  };

  // 🚗 List cars click handler
  const handleListCarsClick = () => {
    if (isOwner) {
      navigate("/owner");
    } else if (!user) {
      setShowLogin(true);
    } else {
      const confirmChange = window.confirm(
        "Do you want to become a car-owner so you can list cars?"
      );
      if (confirmChange) {
        changeRole();
      }
    }
  };

  // 🔍 Search submit handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search)}`);
      setSearch("");
      if (open) setOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 w-full z-30 border-b border-borderColor bg-white ${
        location.pathname === "/" ? "bg-light" : "bg-white"
      }`}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-20 py-4 text-gray-700">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.img whileHover={{scale: 1.05}} src={assets.logo} alt="logo" className="h-8" />
        </Link>

        {/* Desktop links + search */}
        <div className="hidden md:flex items-center gap-6">
          {menuLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              className="hover:text-gray-900 transition-colors"
            >
              {link.name}
            </Link>
          ))}

          {/* Search input */}
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="border border-borderColor rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
            <button type="submit">
              <img
                src={assets.search_icon}
                alt="search"
                className="absolute right-3 top-2.5 h-4 w-4 opacity-70 cursor-pointer"
              />
            </button>
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={handleListCarsClick}
            disabled={changingRole}
            className="cursor-pointer text-sm font-medium"
          >
            {isOwner ? "Dashboard" : changingRole ? "Processing…" : "List Cars"}
          </button>

          <button
            onClick={() => (user ? logout() : setShowLogin(true))}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition shadow-md z-50"
          >
            {user ? "Logout" : "Login"}
          </button>

          {/* Hamburger menu (mobile) */}
          <button
            className="md:hidden cursor-pointer"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <img
              src={open ? assets.close_icon : assets.menu_icon}
              alt="menu"
              className="h-6 w-6"
            />
          </button>
        </div>
      </div>

      {/* Overlay (mobile) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
        ></div>
      )}

      {/* Mobile menu */}
      <div
        className={`fixed top-0 right-0 w-3/4 sm:w-2/3 h-full bg-white z-30 transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col gap-5 mt-10">
          {menuLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              onClick={() => setOpen(false)}
              className="text-lg font-medium text-gray-700"
            >
              {link.name}
            </Link>
          ))}

          {/* Search bar (mobile) */}
          <form onSubmit={handleSearch} className="mt-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="border border-borderColor rounded-md px-3 py-2 text-sm outline-none w-full focus:ring-2 focus:ring-[--color-primary]"
            />
          </form>

          <button
            onClick={() => {
              handleListCarsClick();
              setOpen(false);
            }}
            className="mt-4 text-base font-medium"
          >
            {isOwner ? "Dashboard" : changingRole ? "Processing…" : "List Cars"}
          </button>

          <button
            onClick={() => {
              if (user) logout();
              else setShowLogin(true);
              setOpen(false);
            }}
            className="mt-4 px-4 py-2 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white rounded-lg text-base"
          >
            {user ? "Logout" : "Login"}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

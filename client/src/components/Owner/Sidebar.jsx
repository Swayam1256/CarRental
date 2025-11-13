import React, { useState } from "react";
import { assets, ownerMenuLinks } from "../../assets/assets";
import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, axios, fetchUser, setUser } = useAppContext();
  const location = useLocation();
  const [image, setImage] = useState("");

  const updateImage = async () => {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const { data } = await axios.post("/api/owner/update-image", formData);

      if (data.success) {
        setUser(data.user);
        if (data.token) {
          localStorage.setItem("token", data.token); // ✅ store fresh token
        }
        toast.success(data.message);
        setImage("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full bg-white border-r border-borderColor flex flex-col items-center pt-8 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 sm:w-60`}
      >
        {/* Profile Section */}
        <div className="group relative mb-4">
          <label htmlFor="image" className="cursor-pointer relative">
            <img
              src={
                image
                  ? URL.createObjectURL(image)
                  : user?.image ||
                    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300"
              }
              alt="Profile"
              className="h-14 w-14 rounded-full object-cover border border-borderColor mx-auto"
            />
            <input
              type="file"
              id="image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
            {/* Hover edit icon */}
            <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center rounded-full">
              <img src={assets.edit_icon} alt="edit" className="w-5" />
            </div>
          </label>
        </div>

        {image && (
          <button
            className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-md mb-3 text-sm hover:bg-primary/20 transition"
            onClick={updateImage}
          >
            Save <img src={assets.check_icon} width={13} alt="save" />
          </button>
        )}

        <p className="text-base font-medium text-gray-700 mb-6">{user?.name}</p>

        {/* Menu Links */}
        <nav className="w-full">
          {ownerMenuLinks.map((link, index) => (
            <NavLink
              key={index}
              to={link.path}
              onClick={onClose}
              className={`relative flex items-center gap-3 py-3 pl-6 text-gray-600 hover:bg-primary/10 hover:text-primary transition ${
                link.path === location.pathname
                  ? "bg-primary/10 text-primary"
                  : ""
              }`}
            >
              <img
                src={
                  link.path === location.pathname ? link.coloredIcon : link.icon
                }
                alt={link.name}
                className="w-5"
              />
              <span className="font-medium">{link.name}</span>

              {link.path === location.pathname && (
                <div className="absolute right-0 bg-primary w-1.5 h-8 rounded-l-md"></div>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

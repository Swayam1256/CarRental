import React from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const NavbarOwner = ({ onMenuClick }) => {
  const { user } = useAppContext();

  return (
    <div className="flex items-center justify-between px-6 md:px-10 py-4 text-gray-700 border-b border-borderColor bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden block p-2 rounded-md hover:bg-gray-100 transition"
        >
          <img src={assets.menu_icon} alt="menu" className="w-6 h-6" />
        </button>

        <Link to="/">
          <img src={assets.logo} alt="Logo" className="h-7" />
        </Link>
      </div>

      <p className="text-sm sm:text-base">
        Welcome,&nbsp;
        <span className="font-semibold text-primary">
          {user?.name || "Owner"}
        </span>
      </p>
    </div>
  );
};

export default NavbarOwner;

import React, { useEffect } from "react";
import NavbarOwner from "../../components/Owner/NavbarOwner";
import Sidebar from "../../components/Owner/Sidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Layout = () => {
  const { isOwner, user, navigate } = useAppContext();

  useEffect(() => {
    // wait until user is fetched
    if (user && !isOwner) {
      navigate("/");
    }
  }, [user, isOwner, navigate]);

  // optional: loading screen to avoid flashing redirect
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarOwner />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

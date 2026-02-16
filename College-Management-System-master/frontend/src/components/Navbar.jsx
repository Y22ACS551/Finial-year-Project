import React, { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { RxDashboard } from "react-icons/rx";
import { useNavigate, useLocation } from "react-router-dom";
import axiosWrapper from "../utils/AxiosWrapper";
import CustomButton from "./CustomButton";

const Navbar = () => {
  const navigate = useNavigate();
  const router = useLocation();
  const userType = localStorage.getItem("userType");

  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    if (userType !== "Student") return;

    try {
      const res = await axiosWrapper.get("/notices/student/count");
      setUnread(res.data.unread || 0);
    } catch (err) {
      console.error("Navbar count error", err);
    }
  };

  useEffect(() => {
    fetchUnread();

    const handler = () => fetchUnread();
    window.addEventListener("notice-updated", handler);

    return () => window.removeEventListener("notice-updated", handler);
  }, []);

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userType");
    navigate("/");
  };

  return (
    <div className="shadow-md px-6 py-4 mb-6">
      <div className="max-w-7xl flex justify-between items-center mx-auto">
        <p
          className="font-semibold text-2xl flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <RxDashboard className="mr-2" />
          {router.state?.type || userType} Dashboard
        </p>

        <div className="flex items-center gap-4">
          {userType === "Student" && unread > 0 && (
            <span className="px-3 py-1 text-sm rounded-full bg-red-600 text-white">
              {unread}
            </span>
          )}

          <CustomButton variant="danger" onClick={logout}>
            Logout <FiLogOut className="ml-2" />
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

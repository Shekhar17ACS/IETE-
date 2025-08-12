
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import MemberHeader from "./MemberHeader";
import MemberSidebar from "./MemberSidebar";
import { getSidebarPermissions } from "./utils/roles";

export default function MemberLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const [sidebarRole, setSidebarRole] = useState("user");

  const user = {
    name: "Shekhar",
    avatar: "https://i.pravatar.cc/150?img=7"
  };

  useEffect(() => {
    try {
      const storedRoles = JSON.parse(sessionStorage.getItem("role") || "[]");

      const sidebarAccess = getSidebarPermissions(storedRoles);

      // Update sidebar state
      setSidebarRole(sidebarAccess);
    } catch (error) {
      setSidebarRole("user"); // fallback
    }
  }, []);

  return (
    <div className="flex">
      <MemberSidebar role={sidebarRole} isOpen={isOpen} setIsOpen={setIsOpen} />
      <div
        className={`flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out ${
          isOpen ? "ml-64" : "ml-20"
        }`}
      >
        <MemberHeader user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="pt-16 p-4 bg-gray-100 min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

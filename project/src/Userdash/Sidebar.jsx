

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, FileText, ClipboardCheck, CreditCard } from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const menuItems = [
    { id: "eligible", label: "Application Form", icon: ClipboardCheck, path: "/admin/eligible" },
    { id: "form", label: "Form Tracker", icon: FileText, path: "/admin/form" },
    { id: "payments", label: "Payment History", icon: CreditCard, path: "/admin/payments" },
  ];

return (
    <div className="flex h-full w-full flex-col bg-[#ffffff] shadow-lg">
      <div className="flex h-16 items-center justify-between px-4">
        <h2 className="text-xl font-bold text-black">Dashboard</h2>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-gray-700 hover:bg-gray-100 focus:outline-none"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Highlight if the current path is exactly the item's path or starts with /admin/eligible for the "Application Form"
          const isActive =
            location.pathname === item.path ||
            (item.id === "eligible" && location.pathname.startsWith("/admin/eligible"));
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex w-full items-center rounded-lg px-4 py-2.5 transition-colors ${
                isActive ? "bg-black text-white" : "text-black hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="ml-3 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
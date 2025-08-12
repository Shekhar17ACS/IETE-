








"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import IETE from "../assets/IETE.jpeg";
import {
  LayoutDashboard,
  User,
  Users,
  FileText,
  CreditCard,
  Settings,
  BarChart,
  Lock,
  CctvIcon,
  PersonStandingIcon,
  LogsIcon,
  IdCardIcon,
  LucideFileBarChart,
  Settings2Icon,
  DockIcon,
  BiohazardIcon,
  SearchIcon,
  GroupIcon,
  CreditCardIcon
} from "lucide-react";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import {  hasPermission } from "./utils/permissions";
import { PERMISSION_MAP } from "./utils/permissionMap";

// Fallback role mapping
const fallbackMap = {
  "Fellow": "limited",
  "Member": "limited",
  "Associate": "limited",
  "Associate Member": "limited"
};

const menuItems = {
  // For Admins & Governing Council (use full access)
  admin: [
    {
      group: "Administration",
      icon: BiohazardIcon,
      children: [
        { label: "Matrix Permission", path: "/Memberdashboard/Matrix", icon: CctvIcon },
        { label: "Role Management", path: "/Memberdashboard/Role", icon: PersonStandingIcon },
        { label: "Configuration", path: "/Memberdashboard/Config", icon: Settings2Icon },
      ]
    },
    {
      group: "Management",
      icon: Users,
      children: [
        { label: "Audit Logs", path: "/Memberdashboard/Audit-log", icon: LogsIcon },
        { label: "Member Management", path: "/Memberdashboard/add-member", icon: IdCardIcon },
        { label: "Application Manager", path: "/Memberdashboard/Applicants", icon: User },
        { label: "Reports", path: "/Memberdashboard/Reports", icon: FileText },
        { label: "Approval Status", path: "/Memberdashboard/Approval_Stats", icon: LucideFileBarChart }
      ]
    },
    {
      group: "Accounts",
      icon: CreditCardIcon,
      children: [
        { label: "Payments verification", path: "/Memberdashboard/Accounts", icon: CreditCard },
      ]
    },
    {
      group: "General",
      icon: LayoutDashboard,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "Profile", path: "/Memberdashboard/MemberProfile", icon: GroupIcon }
      ]
    }
  ],

  // For Governing Council (reuse admin layout)
  "Governing Council": [
    // Reuse admin layout if preferred — or create a subset here
    {
      group: "GC Tools",
      icon: BiohazardIcon,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "Applications", path: "/Memberdashboard/Applicants", icon: User },
        { label: "Approvals", path: "/Memberdashboard/Approval_Stats", icon: LucideFileBarChart },
        { label: "Audit Logs", path: "/Memberdashboard/Audit-log", icon: LogsIcon }
      ]
    }
  ],

  // For Staff
  Staff: [
    {
      group: "Staff Panel",
      icon: Users,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "Applications", path: "/Memberdashboard/Applicants", icon: User },
        { label: "Reports", path: "/Memberdashboard/Reports", icon: FileText },
        { label: "Approval Status", path: "/Memberdashboard/Approval_Stats", icon: LucideFileBarChart },
        { label: "Profile", path: "/Memberdashboard/MemberProfile", icon: GroupIcon },
      ]
    }
  ],

  // For Secretary General (Sec Gen)
  "Sec Gen": [
    {
      group: "Sec Gen Tools",
      icon: Settings,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "Member Overview", path: "/Memberdashboard/add-member", icon: Users },
        { label: "Audit Logs", path: "/Memberdashboard/Audit-log", icon: LogsIcon },
        { label: "Profile", path: "/Memberdashboard/MemberProfile", icon: GroupIcon }
      ]
    }
  ],

  // For Super Admin
  "Super Admin": [
    {
      group: "System Admin",
      icon: Settings,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "System Configuration", path: "/Memberdashboard/Config", icon: Settings2Icon },
        { label: "Role Management", path: "/Memberdashboard/Role", icon: PersonStandingIcon },
        { label: "User Access Logs", path: "/Memberdashboard/Audit-log", icon: LogsIcon },
      ]
    }
  ],

  // For Fellows, Members, Associates (limited access)
  limited: [
    {
      group: "My Dashboard",
      icon: LayoutDashboard,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard },
        { label: "My Profile", path: "/Memberdashboard/MemberProfile", icon: User },
        { label: "Certificate", path: "/Memberdashboard/Cert_Id", icon: IdCardIcon }
      ]
    }
  ],

  // Fallback
  user: [
    {
      group: "General",
      icon: LayoutDashboard,
      children: [
        { label: "Dashboard", path: "/Memberdashboard", icon: LayoutDashboard }
      ]
    }
  ]
};

const filterSidebarItemsByPermission = (menuGroups) =>
  menuGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => {
        const permissionCode = PERMISSION_MAP[item.path];
        return !permissionCode || hasPermission(permissionCode); // keep if no permission needed OR permission exists
      }),
    }))
    .filter((group) => group.children.length > 0); // hide empty groups


export default function MemberSidebar({ role, isOpen, setIsOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const sidebarRef = useRef(null);
  const location = useLocation();

  const resolvedRole = fallbackMap[role] || role;
  // const items = menuItems[resolvedRole] || menuItems.user;
  const rawItems = menuItems[resolvedRole] || menuItems.user;
  const items = filterSidebarItemsByPermission(rawItems);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isOpen, setIsOpen]);

  const handleLinkClick = () => {
    if (isMobile || window.innerWidth < 1280) {
      setIsOpen(false);
    }
  };

  const toggleGroup = (groupLabel) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  // Filter items based on search query
  const filteredItems = searchQuery.trim() && role === "user"
    ? items
        .map((group) => ({
          ...group,
          children: group.children.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }))
        .filter((group) => group.children.length > 0)
    : items;

  return (
    <>
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            key="sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 h-screen bg-white text-gray-900 z-40 shadow-lg
              ${isOpen ? "w-64" : "w-0 md:w-20"} 
              ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
              transition-all duration-300 ease-in-out`}
          >
            {/* Header */}
            <div className={`flex items-center justify-center h-16 border-b border-gray-200 ${!isOpen && "md:justify-center"}`}>
              <div className="flex items-center gap-3 mt-4">
                <img
                  src={IETE}
                  alt="IETE Logo"
                  className="h-12 w-12 rounded-full transition-transform duration-300 transform hover:scale-110 md:mx-auto ring-2 ring-blue-300/50"
                />
                <span
                  className={`text-xl font-bold tracking-tight text-gray-900 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 md:hidden"
                  }`}
                >
                  IETE
                </span>
              </div>
            </div>

            {/* Search Bar */}
            {isOpen && (
              <div className="px-3 py-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className={`space-y-3 px-3 py-6 ${!isOpen && "md:px-0"} overflow-y-auto max-h-[calc(100vh-8rem)]`}>
              {filteredItems.length === 0 && searchQuery.trim() && (
                <div className="px-4 py-2 text-sm text-gray-500 italic">
                  No results found
                </div>
              )}
              {filteredItems.map((group) => {
                const isExpanded = openGroups[group.group] || searchQuery.trim();
                const GroupIcon = group.icon;
                return (
                  <div key={group.group}>
                    <button
                      onClick={() => toggleGroup(group.group)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-semibold text-sm
                        ${isOpen ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" : "md:justify-center"}
                        transition-all duration-200 group`}
                    >
                      <div className="flex items-center gap-2">
                        {GroupIcon && <GroupIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />}
                        {isOpen && (
                          <span className="uppercase tracking-wide text-xs">{group.group}</span>
                        )}
                      </div>
                      {isOpen && (
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm text-gray-500"
                        >
                          ▼
                        </motion.span>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pl-6 mt-1 space-y-1"
                        >
                          {group.children.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                                  ${isActive 
                                    ? "bg-blue-100 text-blue-700 font-medium" 
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                                  ${!isOpen && "md:justify-center md:px-0"}
                                  group`}
                              >
                                <Icon className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                                {isOpen && (
                                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                                )}
                                {isActive && isOpen && (
                                  <motion.div
                                    className="absolute inset-0 bg-blue-200/30"
                                    layoutId="activeIndicator"
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                                {!isOpen && (
                                  <span className="absolute left-24 bg-gray-100 text-gray-900 text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {item.label}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            {/* <div
              className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
            >
              <div className="text-xs text-gray-500 text-center font-medium">
                IETE Dashboard v2.1
              </div>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
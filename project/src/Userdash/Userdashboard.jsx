

import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

function Userdashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userEmail = "Shekharsharma17800@gmail.com";
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#f4f2ee]">
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${!isMobile && isSidebarOpen ? "lg:relative lg:z-0" : ""}
        `}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          // Remove activeTab and setActiveTab props
        />
      </aside>

      <div
        className={`flex h-full w-full flex-col transition-all duration-300 ease-in-out
        ${!isMobile && isSidebarOpen ? "lg:ml-0" : "ml-0"}
      `}
      >
        <Header
          email={userEmail}
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-full">
            <Outlet /> {/* Renders nested route components */}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default Userdashboard;
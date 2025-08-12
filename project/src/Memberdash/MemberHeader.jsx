
"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, LogOut, Menu, X, IdCardIcon } from "lucide-react"
import { GetPersonalDetailsProfile } from "../Services/ApiServices/ApiService"

export default function MemberHeader({ user, isOpen, setIsOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [fetchedUser, setFetchedUser] = useState(null) // Store fetched user data
  const [error, setError] = useState("") // Store API errors
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.addEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          setError("No authentication found.")
          return
        }

        const response = await GetPersonalDetailsProfile(token)
        setFetchedUser(response.data) // Store fetched data
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to load user profile."
        )
      }
    }

    fetchUserData()
  }, []) // Empty dependency array to run once on mount

  const handleLogout = () => {
    sessionStorage.removeItem("token") // or sessionStorage.clear()
    sessionStorage.clear()
    navigate("/login")
  }

  return (
    <header
      className={`h-16 bg-white border-b fixed top-0 right-0 z-10 transition-all duration-500 ease-in-out ${
        isMobile ? "left-0" : isOpen ? "left-64" : "left-20"
      }`}
    >
      <div className="h-full flex items-center justify-between px-6">
        <button
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-300 transform hover:scale-105"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-300 transform rotate-0" />
          ) : (
            <Menu className="h-6 w-6 transition-transform duration-300 transform rotate-0" />
          )}
        </button>

        <div className="flex items-center gap-4">
          

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-all duration-300"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 transition-all duration-500 ease-in-out">
                <img
                  src={fetchedUser?.avatar || user.avatar || "/placeholder.svg"} // Use fetched avatar
                  alt={fetchedUser?.name || user.name}
                  className="w-full h-full rounded-full object-cover border-2 border-gray-600 transition-all duration-500 ease-in-out shadow-sm hover:shadow-md"
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border animate-fadeIn transition-all duration-500 ease-in-out">
                <button
                  onClick={() => {
                    navigate("/Memberdashboard/MemberProfile")
                    setIsDropdownOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                {/* <hr className="my-1" /> */}
                <button
                  onClick={() => {
                    navigate("/Memberdashboard/Cert_Id")
                    setIsDropdownOpen(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <IdCardIcon className="w-4 h-4" />
                   ID Card & Cert.
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Display error if API fails */}
      {error && (
        <div className="absolute top-16 right-6 bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </header>
  )
}
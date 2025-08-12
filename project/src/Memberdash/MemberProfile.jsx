






"use client"

import { useState, useEffect } from "react"
import { User, Camera, Bell, Shield, CreditCard } from "lucide-react"
import { changePassword, updatePersonalDetails, GetPersonalDetailsProfile } from "../Services/ApiServices/ApiService"

const dummyUser = {
  name: "Shekhar",
  email: "root@gmail.com",
  designation: "Engineering", // Updated from department
  avatar: "https://i.pravatar.cc/150?img=7",
}

export default function MemberProfile({ user = dummyUser, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState("general")
  const [selectedImage, setSelectedImage] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null) // Store file for PATCH request
  // State for password fields and feedback
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [message, setPasswordMessage] = useState("")
  const [error, setPasswordError] = useState("")
  // State for personal details
  const [name, setName] = useState(user.name)
  const [email, setEmail ] = useState(user.email)
  const [designation, setDesignation] = useState(user.designation)
  const [personalMessage, setPersonalMessage] = useState("")
  const [personalError, setPersonalError] = useState("")

  const tabs = [
    { id: "general", label: "General", icon: User },
    // { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    // { id: "billing", label: "Billing", icon: CreditCard },
  ]

  // Fetch personal details on mount
  useEffect(() => {
    const fetchPersonalDetails = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          setPersonalError("You must be logged in to view your profile.")
          return
        }

        const response = await GetPersonalDetailsProfile(token)
        const { name, email, designation, avatar } = response.data
        setName(name || user.name)
        setEmail(email || user.email)
        setDesignation(designation || user.designation)
        setSelectedImage(avatar || user.avatar) // Update avatar if provided
      } catch (err) {
        setPersonalError(
          err.response?.data?.error || "Failed to load personal details."
        )
      }
    }

    fetchPersonalDetails()
  }, []) // Empty dependency array to run once on mount

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setAvatarFile(file) // Store file for PATCH request
      // Call onUpdateProfile with the file and temporary URL for persistence
      if (onUpdateProfile) {
        onUpdateProfile({ ...user, avatar: imageUrl, file })
      }
    }
  }

  // Handle designation input change
  const handleDesignationChange = (e) => {
    setDesignation(e.target.value)
  }

  // Handle personal details form submission
  const handlePersonalDataSubmit = async (e) => {
    e.preventDefault()
    setPersonalMessage("")
    setPersonalError("")

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        setPersonalError("You must be logged in to update your profile.")
        return
      }

      const response = await updatePersonalDetails(
        { designation, file: avatarFile },
        token
      )
      setPersonalMessage(response.data.message || "Profile updated successfully.")
      // Update parent component if needed
      if (onUpdateProfile) {
        onUpdateProfile({ ...user, designation, avatar: selectedImage || user.avatar })
      }
    } catch (err) {
      setPersonalError(
        err.response?.data?.error || "An error occurred while updating the profile."
      )
    }
  }

  // Handle password input changes
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMessage("")
    setPasswordError("")

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        setPasswordError("You must be logged in to change your password.")
        return
      }

      const response = await changePassword(passwordData, token)
      setPasswordMessage(response.data.message || "Password updated successfully.")
      // Reset form
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || "An error occurred while updating the password."
      )
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 transition-all duration-500 ease-in-out">
                <img
                  src={selectedImage || user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover shadow-md border-2 border-gray-100 transition-all duration-500 ease-in-out"
                />
              </div>
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-all duration-500 ease-in-out transform hover:scale-105 cursor-pointer"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{name}</h1> {/* Use state for display */}
              <p className="text-gray-500">{email}</p> {/* Use state for display */}
            </div>
          </div>
        </div>

        <div className="border-b">
          <nav className="flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <form className="space-y-6" onSubmit={handlePersonalDataSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={name} // Controlled input
                  disabled
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 text-gray-600 shadow-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email} // Controlled input
                  disabled
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 text-gray-600 shadow-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={designation}
                  onChange={handleDesignationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {/* Display success or error messages */}
              {personalMessage && <p className="text-green-600">{personalMessage}</p>}
              {personalError && <p className="text-red-600">{personalError}</p>}
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Save Changes
              </button>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Email notifications for updates</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Email notifications for reports</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span>SMS notifications</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
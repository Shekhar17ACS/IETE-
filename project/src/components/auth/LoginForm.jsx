"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import OTPVerification from "./OTPVerification";
import { Login, UpdateFormData } from "../Redux/ReduxSlice/LoginSlice";
import { useSelector, useDispatch } from "react-redux";
import { Lock, Mail, Eye, EyeOff, Hash } from "lucide-react";

export function LoginForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isIeteLoading, setIsIeteLoading] = useState(false);
  const [isNewUserLoading, setIsNewUserLoading] = useState(false);
  const [rememberIete, setRememberIete] = useState(false);
  const [rememberNewUser, setRememberNewUser] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [ieteFormData, setIeteFormData] = useState({
    membershipId: "",
    email: "",
    password: "",
  }); // Local state for IETE form
  const [newUserFormData, setNewUserFormData] = useState({
    identifier: "",
    password: "",
  }); // Local state for New User form
  const [showIetePassword, setShowIetePassword] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const dispatch = useDispatch();
  const { formData } = useSelector((state) => state.LoginUser);

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleVerifyOtp = (otpInput) => {
    if (otpInput === "123456") {
      setIsOtpModalOpen(false);
      toast.success("Login successful! Redirecting...", { autoClose: 2000 });
      setTimeout(() => navigate("/admin/eligible/step1"), 2000);
    } else {
      toast.error("Invalid OTP");
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleResendOtp = () => {
    setTimeout(() => {
      toast.info("OTP resent successfully!");
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  useEffect(() => {
    const savedIete = JSON.parse(localStorage.getItem("rememberedIete"));
    if (savedIete) {
      setIeteFormData({
        membershipId: savedIete.membership_id || "", // 👈 make sure this matches the key used during save
        email: savedIete.email || savedIete.mobile_number || "",
        // password: savedIete.password || ""
        password: "",
      });
      setRememberIete(true);
    }

    const savedNewUser = JSON.parse(localStorage.getItem("rememberedNewUser"));
    if (savedNewUser) {
      setNewUserFormData({
        identifier: savedNewUser.identifier || "",
        password: savedNewUser.password || "",
      });
      setRememberNewUser(true);
    }
  }, []);

  // Handle form submission for both IETE and New User forms
  const handleSubmit = async (e, formType) => {
    e.preventDefault();
    let dataToSubmit = formType === "iete" ? ieteFormData : newUserFormData;

    if (formType === "iete") {
      const { membershipId, email, password } = ieteFormData;

      if (!membershipId && !email) {
        toast.error("Please enter either Membership ID or Email/Mobile.");
        return;
      }

      if (!password || password.trim() === "") {
        toast.error("Password is required.");
        return;
      }

      if (rememberIete) {
        const savedData = {
          membership_id: membershipId.trim(), // ← Save the membership ID
          email: email.trim() || "",
          mobile_number: "", // if not used
          // password: password
        };
        localStorage.setItem("rememberedIete", JSON.stringify(savedData));
      }

      // Prefer Membership ID if provided
      if (membershipId) {
        dataToSubmit = { membership_id: membershipId.trim(), password };
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^\d{10}$/;

        if (emailRegex.test(email)) {
          dataToSubmit = { email: email.trim(), password };
        } else if (mobileRegex.test(email)) {
          dataToSubmit = { mobile_number: email.trim(), password };
        } else {
          toast.error("Please enter a valid email or 10-digit mobile number.");
          return;
        }
      }
      setIsIeteLoading(true);
    } else {
      const { identifier, password } = newUserFormData;
      if (!identifier) {
        toast.error(
          "Please provide a mobile number, email, or application ID."
        );
        return;
      }

      if (rememberNewUser) {
        const savedData = {
          identifier: newUserFormData.identifier, // just save what user typed
          // password: newUserFormData.password
        };
        localStorage.setItem("rememberedNewUser", JSON.stringify(savedData));
      } else {
        localStorage.removeItem("rememberedNewUser");
      }

      // Classify the identifier
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^\d{10}$/;

      if (emailRegex.test(identifier)) {
        dataToSubmit = {
          email: identifier,
          mobile_number: "",
          application_id: "",
          password,
        };
      } else if (mobileRegex.test(identifier)) {
        dataToSubmit = {
          email: "",
          mobile_number: identifier,
          application_id: "",
          password,
        };
      } else {
        dataToSubmit = {
          email: "",
          mobile_number: "",
          application_id: identifier,
          password,
        };
      }
      setIsNewUserLoading(true);
    }

    try {
      // setIsLoading(true)
      const resultAction = await dispatch(Login(dataToSubmit));
      if (Login.fulfilled.match(resultAction)) {
        toast.success("Successfully logged in");
        // navigate("/admin/eligible/step1")
        if (dataToSubmit.membership_id) {
          navigate("/Memberdashboard");
        } else {
          navigate("/admin/eligible/step1");
        }
      } else if (Login.rejected.match(resultAction)) {
        const errorMessage =
          resultAction.payload?.error ||
          "Incorrect credentials. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      // setIsLoading(false)
      setIsIeteLoading(false);
      setIsNewUserLoading(false);
    }
  };

  const handleIeteChange = (e) => {
    const { name, value } = e.target;
    setIeteFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 px-4 py-6 md:p-6 gap-4 md:gap-10 max-w-full mx-auto">
      {/* Left Section - IETE Members Login */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full md:w-1/2 flex items-center justify-center"
      >
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-200/50 transform hover:scale-105 transition-transform duration-300 ease-in-out">
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
          >
            Existing IETE Members
          </motion.h2>

          <form
            onSubmit={(e) => handleSubmit(e, "iete")}
            className="space-y-4 sm:space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Membership ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="membershipId"
                  value={ieteFormData.membershipId}
                  onChange={handleIeteChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter membership ID"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email / Mobile
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="email"
                  value={ieteFormData.email}
                  onChange={handleIeteChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter email or mobile"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showIetePassword ? "text" : "password"}
                  name="password"
                  value={ieteFormData.password}
                  onChange={handleIeteChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    title={showIetePassword ? "Hide password" : "Show password"}
                    onClick={() => setShowIetePassword(!showIetePassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showIetePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"
            >
              <div className="flex items-center">
                <input
                  id="remember-me-iete"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberIete}
                  onChange={(e) => setRememberIete(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label
                  htmlFor="remember-me-iete"
                  className="ml-2 block text-xs sm:text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => handleForgotPassword("iete")} //
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
              >
                Forgot Password?
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:from-gray-800 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                // isLoading={isLoading}
                isLoading={isIeteLoading}
              >
                Sign In
              </Button>
            </motion.div>
          </form>

          <AnimatePresence>
            {isOtpModalOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OTPVerification
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  isLoading={isLoading}
                  onClose={() => setIsOtpModalOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Separator */}
      <div className="hidden md:flex items-center justify-center">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "80%", opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="w-px bg-white/50 dashed-border relative"
        >
          <style jsx>{`
            .dashed-border {
              background: linear-gradient(
                to bottom,
                transparent 50%,
                rgba(255, 255, 255, 0.5) 50%
              );
              background-size: 2px 8px;
            }
          `}</style>
        </motion.div>
      </div>

      {/* Right Section - New User Login */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full md:w-1/2 flex items-center justify-center"
      >
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-200/50 transform hover:scale-105 transition-transform duration-300 ease-in-out">
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
          >
            New User Login
          </motion.h2>

          <form
            onSubmit={(e) => handleSubmit(e, "newUser")}
            className="space-y-4 sm:space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Mobile Number / Email / Application ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  // name="email"
                  name="identifier"
                  // value={newUserFormData.email}
                  value={newUserFormData.identifier}
                  onChange={handleNewUserChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter mobile, email, or application ID"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showNewUserPassword ? "text" : "password"}
                  name="password"
                  value={newUserFormData.password}
                  onChange={handleNewUserChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 hover:border-blue-300"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    title={
                      showNewUserPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewUserPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"
            >
              <div className="flex items-center">
                <input
                  id="remember-me-newuser"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberNewUser}
                  onChange={(e) => setRememberNewUser(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label
                  htmlFor="remember-me-newuser"
                  className="ml-2 block text-xs sm:text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => handleForgotPassword("newUser")} //
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
              >
                Forgot Password?
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:from-gray-800 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                // isLoading={isLoading}
                isLoading={isNewUserLoading}
              >
                Sign In
              </Button>
            </motion.div>
          </form>

          <motion.p
            variants={itemVariants}
            className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600"
          >
            <b>
              First time user?{" "}
              <a
                onClick={() => navigate("/register")}
                handleClick={handleClick}
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300 relative after:content-[''] after:absolute after:w-full after:h-[2px] after:bg-blue-600 after:left-0 after:bottom-[-4px] after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                <button>Register Here</button>
              </a>{" "}
              to apply for IETE Membership
            </b>
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mt-3 sm:mt-4 text-center text-xs text-gray-500"
          >
            For assistance, contact support at{" "}
            <a
              href="mailto:support@iete.org"
              className="text-blue-600 hover:underline transition-colors duration-300"
            >
              support@iete.org
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

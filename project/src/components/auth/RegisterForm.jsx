import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "../ui/Button"
import { toast } from "react-hot-toast"
import "react-toastify/dist/ReactToastify.css"
import OTPVerification from "./OTPVerification"
import { useSelector, useDispatch } from "react-redux"
import { UpdateFormData, SignUp } from "../Redux/ReduxSlice/UserSlice"
import { ArrowRight, CheckCircle, Lock, Mail, Phone, EyeOff, Eye, User } from "lucide-react"

export function RegisterForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const { formData: formdata } = useSelector((state) => state.user)
  const [otp, setOtp] = useState("")
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [otpModel, setOtpModel] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // const handleSubmit = (e) => {
  //   e.preventDefault()
  //   dispatch(SignUp(formdata))
  //   setOtpModel(true)
  //   setOtp("123456")
  //   setIsOtpModalOpen(true)
  // }
  const handleSubmit = async (e) => {
    e.preventDefault()
  
    // Validate password length
    if (formdata.password.length < 9) {
      toast.error("Password must be at least 9 characters long.", {
        position: "top-right",
        autoClose: 2000,
      })
      return; // Prevent form submission and OTP modal from opening
    }
  
    // Validate password confirmation
    if (formdata.password !== formdata.confirm_password) {
      toast.error("Passwords do not match.", {
        position: "top-right",
        autoClose: 2000,
      })
      return; // Prevent form submission and OTP modal from opening
    }
  
    // Proceed to open OTP modal if validations are passed
    // dispatch(SignUp(formdata))
    // setOtpModel(true)
    // setOtp("123456")
    // setIsOtpModalOpen(true)
      const action = await dispatch(SignUp(formdata));

  if (SignUp.fulfilled.match(action)) {
    const type = action.payload?.status_type;

    if (type === "new_signup" || type === "inactive_retry") {
      setOtpModel(true);
      setIsOtpModalOpen(true);
    } else if (type === "already_active") {
      setIsOtpModalOpen(false);
      setOtpModel(false);
    }
  }
  }

  const onCloseModel = () => {
    setIsOtpModalOpen(false)
    setOtpModel(false)
  }

  const getPasswordStrength = (password) => {
  if (!password) return "";
  if (password.length < 9) return "Weak";
  if (password.length >= 9 && /[A-Z]/.test(password) && /\d/.test(password)) return "Strong";
  return "Medium";
};

  // const handleChange = (e) => {
  //   dispatch(UpdateFormData(e.target))
  // }
  const handleChange = (e) => {
  const { name, value } = e.target;
  dispatch(UpdateFormData({ name, value: name === "email" || name === "last_name" || name === "password" || name === "confirm_password" ? value : value.toUpperCase() }));
}

  const handleVerifyOtp = (otpInput) => {
    if (otpInput === "123456") {
      setIsOtpModalOpen(false)
      setOtpModel(false)
      toast.success("Success! OTP validation is done")
      navigate("/login")
      toast.success("Registration successful! You can now login.", {
        position: "top-right",
        autoClose: 2000,
      })
    } else {
      toast.error("Invalid OTP", {
        position: "top-right",
        autoClose: 2000,
      })
    }
  }
    const handleClick = (e) => {
  e.preventDefault();
  navigate("/terms");
  navigate("/privacy");
  navigate("/login")
};

  // const handleResendOtp = () => {
  //   setTimeout(() => {
  //     setOtp("")
  //     toast.info("OTP resent successfully!")
  //   }, 1000)
  // }
  const handleResendOtp = () => {
  setIsLoading(true);
  setTimeout(() => {
    setOtp("123456");
    setIsLoading(false);
    toast.info("OTP resent successfully!");
  }, 1000);
};

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  }

  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.3 },
    },
    blur: {
      scale: 1,
      boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
      transition: { duration: 0.3 },
    },
  }

  return (
    <>
      {otpModel && (
        <OTPVerification
          isOtpModalOpen={isOtpModalOpen}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          isLoading={isLoading}
          onClose={onCloseModel}
        />
      )}

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Description Section - Left side on desktop, top on mobile */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full md:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:p-12 flex flex-col justify-center"
        >
          <div className="max-w-md mx-auto">
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-6">
                Join the IETE Community
              </h1>
              <p className="text-gray-300 mb-6">
                Become a member of India's leading professional society for
                electronics and telecommunication engineers.
              </p>

              <div className="space-y-4 mt-8">
                <motion.div
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-3 text-blue-400" />
                  <p>Access to exclusive technical resources and journals</p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-3 text-blue-400" />
                  <p>Networking opportunities with industry professionals</p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-3 text-blue-400" />
                  <p>Discounted rates for workshops and conferences</p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-3 text-blue-400" />
                  <p>Professional development and certification programs</p>
                </motion.div>
              </div>
            </motion.div>

            {/* <motion.div variants={itemVariants} className="mt-8">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Prof. Sunil Mehta</h3>
                    <p className="text-sm text-gray-400">IETE Fellow Member</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  "IETE membership has been instrumental in my professional growth. The technical resources and
                  networking opportunities are unparalleled in the industry."
                </p>
              </div>
            </motion.div> */}

            <motion.div variants={itemVariants} className="mt-8">
              <a
                href="https://www.iete.org/iete-membership/"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                Learn more about membership benefits
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Registration Form Section - Right side on desktop, bottom on mobile */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center"
        >
          <div className="w-full max-w-md">
            <motion.h2
              variants={itemVariants}
              className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8"
            >
              IETE Membership Registration
            </motion.h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title and First Name */}
              <motion.div variants={itemVariants} className="flex space-x-3">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                    </div>
                    <motion.input
                      name="name"
                      type="text"
                      required
                      value={formdata?.name || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                      placeholder="Name"
                      variants={inputVariants}
                      whileFocus="focus"
                    />
                  </div>
                </div>
              </motion.div>
              {/* <motion.div variants={itemVariants} className="flex space-x-3">
                <div className="w-1/4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  {formdata?.title === "Other" ? (
                    <div className="relative">
                      <motion.input
                        name="custom_title"
                        type="text"
                        value={formdata?.custom_title || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 pr-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                        placeholder="Custom title"
                        variants={inputVariants}
                        whileFocus="focus"
                      />
                      <div
                        className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer"
                        onClick={() => {
                          // Reset to default dropdown
                          const updatedFormData = { ...formdata, title: "" }
                          dispatch(UpdateFormData({ name: "title", value: "" }))
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <motion.select
                      name="title"
                      value={formdata?.title || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                      variants={inputVariants}
                      whileFocus="focus"
                    >
                      <option value="">Select</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Other">Other</option>
                    </motion.select>
                  )}
                </div>
                <div className="w-3/4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <motion.input
                      name="name"
                      type="text"
                      required
                      value={formdata?.name || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                      placeholder="First name"
                      variants={inputVariants}
                      whileFocus="focus"
                    />
                  </div>
                </div>
              </motion.div> */}

              {/* Middle Name */}
              {/* <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <motion.input
                  name="middle_name"
                  type="text"
                  value={formdata?.middle_name || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                  placeholder="Middle name (optional)"
                  variants={inputVariants}
                  whileFocus="focus"
                />
              </motion.div> */}

              {/* Last Name */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>
                <motion.input
                  name="last_name"
                  type="text"
                  required
                  value={formdata?.last_name || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                  placeholder="Last name"
                  variants={inputVariants}
                  whileFocus="focus"
                />
                </div>
              </motion.div>

              {/* Email Address */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>
                  <motion.input
                    name="email"
                    type="email"
                    required
                    value={formdata?.email || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                    placeholder="your.email@example.com"
                    variants={inputVariants}
                    whileFocus="focus"
                  />
                </div>
              </motion.div>

              {/* Mobile Number */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>
                  <motion.input
                    name="mobile_number"
                    type="number"
                    required
                    value={formdata?.mobile_number || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                    placeholder="+91-XXXX-XXXXXX"
                    variants={inputVariants}
                    whileFocus="focus"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>
                  <motion.input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formdata?.password || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Password (9+ characters)"
                    variants={inputVariants}
                    whileFocus="focus"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {formdata?.password && (
                  <p
                    className={`text-sm mt-1 ${
                      getPasswordStrength(formdata.password) === "Strong"
                        ? "text-green-600"
                        : getPasswordStrength(formdata.password) === "Medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    Password Strength: {getPasswordStrength(formdata.password)}
                  </p>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-focus-within:text-blue-500 transition-colors z-10" />
                  </div>
                  <motion.input
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formdata?.confirm_password || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Confirm password"
                    variants={inputVariants}
                    whileFocus="focus"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {formdata?.confirm_password && (
                  <p
                    className={`text-sm mt-1 ${
                      formdata.confirm_password === formdata.password
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formdata.confirm_password === formdata.password
                      ? "✅ Passwords match"
                      : "❌ Passwords do not match"}
                  </p>
                )}
              </motion.div>

              {/* Terms and Conditions */}
              <motion.div variants={itemVariants} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I agree to the{" "}
                    <a
                      // href="/terms"
                      // onClick={() => navigate("/terms")}
                      onClick={() => window.open("/terms", "_blank")}
                      handleClick={handleClick}
                      className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      // href="/privacy"
                      // onClick={() => navigate("/privacy")}
                      onClick={() => window.open("/privacy", "_blank")}
                      handleClick={handleClick}
                      className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </motion.div>

              {/* Register Button */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 rounded-lg font-semibold hover:from-gray-900 hover:to-black transition-all duration-300 shadow-md hover:shadow-lg"
                  isLoading={isLoading}
                >
                  Register
                </Button>
              </motion.div>
            </form>

            {/* Login Link */}
            <motion.p
              variants={itemVariants}
              className="mt-8 text-center text-sm text-gray-600"
            >
              Already have an account?{" "}
              <a
                // href="/login"
                onClick={() => navigate("/login")}
                handleClick={handleClick}
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300 cursor-pointer"
              >
                Sign in
              </a>
            </motion.p>

            {/* Additional help text */}
            <motion.p
              variants={itemVariants}
              className="mt-4 text-center text-xs text-gray-500"
            >
              Need help with registration?{" "}
              <a
                href="mailto:support@iete.org"
                className="text-blue-600 hover:underline"
              >
                Contact support
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

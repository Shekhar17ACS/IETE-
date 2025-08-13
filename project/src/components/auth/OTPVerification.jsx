// export default OTPVerification;
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import {
  postOtp,
  UpdateFormData,
  resendOtpThunk,
} from "../Redux/ReduxSlice/OtpSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const OTPVerification = ({
  onVerify,
  onResend,
  isLoading,
  onClose,
  isOtpModalOpen,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Array for 6 OTP digits
  const [error, setError] = useState(null);
  // const [resent, setResent] = useState(false);
  const [isResending, setIsResending] = useState(false); //
  const [resendAttempts, setResendAttempts] = useState(0); // Track resend attempts
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otplength, setOtplength] = useState(null);
  const { formData } = useSelector((state) => state.otp);
  const { formData: formDatawithemail } = useSelector((state) => state.user);

  useEffect(() => {
    if (isResending) {
      setTimer(300); // Reset timer on resend
    }
  }, [isResending]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (formDatawithemail?.email) {
      const emailParts = formDatawithemail.email.split("@");
      const masked = `${emailParts[0].slice(0, 3)}*****@${emailParts[1]}`;
      setMaskedEmail(masked);
    }
  }, [formDatawithemail]);

  const handleResend = () => {
    if (resendAttempts >= 2) {
      setError("Maximum resend attempts reached. Please try again later.");
      toast.error("Maximum resend attempts reached. Please try again later.");
      return;
    }

    if (isResending) {
      setError("Resending OTP, please wait...");
      toast.success("Resending OTP, please wait...");
      return;
    }

    if (timer > 0) {
      // setError(`Please wait ${Math.floor(timer / 60)}:${("0" + (timer % 60)).slice(-2)} before resending.`);
      toast.error(
        `Please wait ${Math.floor(timer / 60)}:${("0" + (timer % 60)).slice(
          -2
        )} before resending.`
      );
      return;
    }

    setIsResending(true);
    dispatch(resendOtpThunk({ email: formDatawithemail?.email }))
      .then((response) => {
        if (response.type === "otp/resendOtp/rejected ") {
          setResendAttempts((prev) => prev + 1); // Increment the resend attempts
          setIsResending(true);
          toast.success(response.payload); // Use the payload message
        } else if (response.type === "otp/resendOtp/fulfilled") {
          // Reset the timer on successful resend
          setTimer(300); // Reset timer to 5 minutes (300 seconds)
          setResendAttempts(0); // Optionally reset attempts on success
          setIsResending(true);
          toast.success("OTP has been resent successfully.");
        }
      })
      .catch((error) => {
        // setError("An error occurred while resending OTP. Please try again.");
        toast.error("An error occurred while resending OTP. Please try again.");
      })
      .finally(() => {
        setIsResending(false);
      });
  };

  const handleInputChange = (e, index) => {
    const { value } = e.target;

    // Handle paste event
    if (e.type === "paste") {
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, ""); // Get only digits
      if (pastedData.length <= 6) {
        const otpArray = pastedData.padEnd(6, "").split("").slice(0, 6); // Ensure 6 digits
        dispatch(UpdateFormData({ name: "otp", value: otpArray.join("") }));
        // Focus the last filled input or the last input
        const lastFilledIndex = Math.min(pastedData.length - 1, 5);
        document.getElementById(`otp-${lastFilledIndex}`).focus();
      }
      return;
    }

    // Handle manual input
    if (!/^[0-9]?$/.test(value)) return;

    let otpArray = formData?.otp
      ? formData.otp.split("")
      : new Array(6).fill("");
    otpArray[index] = value;

    // Focus navigation for manual input
    if (value === "") {
      if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    } else {
      if (index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }

    const otpString = otpArray.join("");
    dispatch(UpdateFormData({ name: "otp", value: otpString }));
  };

  const varifyOtp = () => {
    dispatch(postOtp(formData))
      .then((response) => {
        if (response.payload && response.payload.message) {
          dispatch(UpdateFormData({ name: "otp", value: "" }));
          navigate("/login");
        } else {
          setError(
            response.payload.message || "OTP is incorrect. Please try again."
          );
        }
      })
      .catch((error) => {
        // setError("An error occurred while verifying OTP. Please try again.");
        toast.error("An error occurred while verifying OTP. Please try again.");
      });
  };

  useEffect(() => {
    dispatch(
      UpdateFormData({ name: "email", value: formDatawithemail?.email })
    );
  }, [formDatawithemail]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.32, 0.72, 0, 1],
        when: "beforeChildren",
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const inputVariants = {
    focus: {
      scale: 1.06,
      boxShadow:
        "0 0 0 3px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0, 0, 0, 0.06)",
      borderColor: "rgba(99, 102, 241, 0.9)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      transition: { duration: 0.25, ease: "easeOut" },
    },
    blur: {
      scale: 1,
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
      borderColor: "rgba(209, 213, 219, 0.5)",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900/80 to-black/80 flex justify-center items-center z-50"
      >
        <motion.div
          variants={itemVariants}
          className="max-w-lg w-full mx-4 py-8 px-6 bg-gradient-to-br from-white/97 to-gray-50/97 backdrop-blur-3xl rounded-3xl shadow-2xl border border-gray-100/30 relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(235, 240, 255, 0.98) 100%), radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.07) 0%, transparent 65%)",
            boxShadow:
              "0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.6)",
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            animate={{
              background: [
                "radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
                "radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
                "radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-15"
              animate={{
                scale: [1, 1.03, 1],
                rotate: [0, 3, 0],
                x: [-5, 5, -5],
                y: [-5, 5, -5],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, transparent 85%)",
                filter: "blur(20px)",
              }}
            />
          </motion.div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-800 transition-all duration-300 transform hover:scale-115 hover:rotate-90 z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <motion.h2
            variants={itemVariants}
            className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-center mb-10 relative z-10 drop-shadow-sm"
          >
            Verify OTP
          </motion.h2>
          <motion.div className="text-center mb-4">
            <p
              className={`text-lg font-medium ${
                timer <= 60 ? "text-red-600" : "text-green-600"
              }`}
            >
              {`Time remaining: ${Math.floor(timer / 60)}:${(
                "0" +
                (timer % 60)
              ).slice(-2)}`}
            </p>
            <p className="text-sm text-gray-600">
              {`OTP sent to: ${maskedEmail}`}
            </p>
            {timer === 0 && (
              <p className="text-red-600 font-medium">
                OTP has expired. Please resend now.
              </p>
            )}
          </motion.div>

          <motion.div className="flex justify-center gap-3 mb-10 relative z-10">
            {[...Array(6)].map((_, index) => (
              <motion.input
                key={index}
                id={`otp-${index}`}
                type="text"
                name="otp"
                value={formData?.otp?.[index] || ""}
                onChange={(e) => handleInputChange(e, index)}
                onPaste={(e) => handleInputChange(e, index)}
                maxLength={1}
                className="w-12 h-12 text-center rounded-xl border py-2 bg-white/70 text-gray-900 shadow-md placeholder:text-gray-400/70 focus:ring-0 transition-all duration-300 text-xl font-medium outline-none appearance-none"
              />
            ))}
          </motion.div>

          {error && (
            <motion.p
              variants={itemVariants}
              className="text-red-600 text-sm mb-8 text-center relative z-10 font-medium "
            >
              {error}
            </motion.p>
          )}

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10"
          >
            <Button
              type="button"
              onClick={varifyOtp}
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:via-indigo-800 hover:to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-xl relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white/50"
            >
              <motion.span
                className="absolute inset-0 bg-white/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              <span className="relative z-10">Verify</span>
            </Button>

            <Button
              type="button"
              onClick={handleResend}
              className="w-full bg-gradient-to-r from-gray-600 via-gray-700 to-gray-600 hover:from-gray-700 hover:via-gray-800 hover:to-gray-700 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-xl relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white/50"
            >
              <motion.span
                className="absolute inset-0 bg-white/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              <span className="relative z-10">Resend OTP</span>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default OTPVerification;

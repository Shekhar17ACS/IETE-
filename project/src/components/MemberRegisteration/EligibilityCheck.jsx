

import React, { useState } from "react";
import { useSelector } from "react-redux"; // Added for Redux state access
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getEligibility } from "../../Services/ApiServices/ApiService"; // Correct import path
import { useOutletContext } from "react-router-dom";

const EligibilityCheck = ({ nextStep, prevStep, formData }) => {
  const {  handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const [eligible, setEligible] = useState(null);
  const [eligiblePlans, setEligiblePlans] = useState([]); // New state for plans

  // Access token from Redux state
  const loginUserToken = useSelector((state) => state.LoginUser?.token);

  const checkEligibility = async () => {
    try {
      // Try Redux token first, then fall back to sessionStorage
      let token = loginUserToken;
      if (!token) {
        token = sessionStorage.getItem("token");
      }

      // Check if token is available
      if (!token) {
        throw new Error("Token is not available. Please log in again.");
      }

      const response = await getEligibility(token);
      setEligible(response.is_eligible);
      if (response.is_eligible) {
        setEligiblePlans(response.eligible_plans);
      } else {
        setEligiblePlans([]);
      }
    } catch (error) {
    
      setEligible(false);
      setEligiblePlans([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-100 rounded-3xl"
    >
      
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4"
      >
        {/* Eligibility Check */}
      </motion.h2>

      
      <p className="text-base sm:text-lg text-gray-600 text-center mb-6">
        Check if you qualify for this course based on your qualifications.
      </p>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkEligibility}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-all duration-300 text-sm sm:text-base"
        >
          Click Here Check Eligibility
        </motion.button>
      </div>

    
      {eligible !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`mt-5 flex items-center justify-center gap-3 p-4 text-sm sm:text-base font-semibold rounded-lg shadow-md ${
            eligible ? "bg-green-500 text-white shadow-green-400/40" : "bg-red-500 text-white shadow-red-400/40"
          }`}
        >
          {eligible ? (
            <FaCheckCircle className="text-lg sm:text-xl" />
          ) : (
            <FaTimesCircle className="text-lg sm:text-xl" />
          )}
          <span>
            {eligible ? "You are eligible!" : "You are not eligible."}
          </span>
        </motion.div>
      )}

     

    
      <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevStep}
          className="px-4 py-2 sm:px-5 sm:py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 text-sm sm:text-base"
        >
          ← Back
        </motion.button>

        {eligible && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextStep}
            className="px-4 py-2 sm:px-5 sm:py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-all duration-300 text-sm sm:text-base"
          >
            Proceed to Form Preview →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EligibilityCheck;
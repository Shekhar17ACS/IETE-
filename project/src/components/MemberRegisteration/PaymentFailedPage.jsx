import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PaymentFailedPage = ({ transactionNumber }) => {
  const [attemptDate] = useState(new Date().toLocaleDateString());
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(transactionNumber.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      {/* Semi-transparent overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 p-8 text-center shadow-xl"
        >
          {/* Failure icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
            className="mb-6"
          >
            <svg
              className="w-20 h-20 text-red-500 mx-auto animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 perspectiveTransform((x) => {
                const scale = 1.2;
                return {
                  translateX: x / scale - x,
                  translateY: x / scale - x,
                };
              }) rotate(-45deg) scale(0.7);
            }"
                className="w-12 h-12 text-red-500 animate-pulse"
              />
            </svg>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500"
          >
            Payment Failed
          </motion.h1>

          {/* Message */}
          <p className="text-gray-600 text-lg font-medium mt-4">
            We're sorry, but your payment could not be processed. Please try
            again or contact support.
          </p>

          {/* Transaction Details */}
          <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg mt-6 border border-white/20">
            <p className="text-sm text-gray-800">
              Transaction ID:{" "}
              <span className="font-bold">{transactionNumber}</span>
            </p>
            <p className="text-sm text-gray-800">Date: {attemptDate}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className={`mt-2 text-sm px-3 py-1 rounded-full ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              {copied ? "Copied!" : "Copy Transaction ID"}
            </motion.button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin/eligible/step6")}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
            >
              Try Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/support")}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
            >
              Contact Support
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentFailedPage;

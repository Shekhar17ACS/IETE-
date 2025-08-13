import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ThankYouPage = ({ transactionNumber }) => {
  const [purchaseDate] = useState(new Date().toLocaleString());
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 300);
    setTimeout(() => clearInterval(timer), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(confettiTimer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(transactionNumber.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
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
          {/* Confetti effect */}
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={300}
              gravity={0.2}
            />
          )}

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
            className="mb-6"
          >
            <svg
              className="w-20 h-20 text-green-500 mx-auto animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500"
          >
            Thank You!
          </motion.h1>

          {/* Message */}
          <p className="text-gray-600 text-lg font-medium mt-4">
            Your payment was successful! Your order is being processed.
          </p>

          {/* Transaction details */}
          <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg mt-6 border border-white/20">
            <p className="text-sm text-gray-800">
              Transaction ID:{" "}
              <span className="font-bold">{transactionNumber}</span>
            </p>
            <p className="text-sm text-gray-800">Date & Time: {purchaseDate}</p>
            <p className="text-sm text-gray-800">
              Status: {progress === 100 ? "Completed" : "In Progress"}
            </p>
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

          {/* Navigation button */}
          <div className="flex justify-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin/payments")}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
            >
              Go to Payment History
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;

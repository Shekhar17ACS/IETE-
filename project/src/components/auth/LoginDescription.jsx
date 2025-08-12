"use client"

import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"  
import { useNavigate } from "react-router-dom";




export function LoginDescription() {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 8px 24px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white flex items-center justify-center p-6 md:p-12 lg:p-16 overflow-hidden"
    >
      {/* <div className="max-w-2xl w-full mx-auto bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 p-8 md:p-10 lg:p-12 transform transition-all duration-500 hover:shadow-3xl"> */}
      <div className="max-w-2xl w-full mx-auto  rounded-2xl p-8 md:p-10 lg:p-12 transform transition-all duration-500 hover:shadow-3xl">

        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-blue-300 to-white bg-clip-text text-transparent">
          Welcome to IETE Member Portal
          </h1>
          <p className="mt-4 text-lg md:text-xl lg:text-2xl text-gray-300 font-light leading-relaxed max-w-lg mx-auto">
          Access exclusive resources, connect with fellow members, and stay updated with the latest in technology
          and engineering.
          </p>
        </motion.div>

        {/* Features List */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="flex items-start space-x-4 group">
            <CheckCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" />
            <p className="text-base md:text-lg text-gray-200 group-hover:text-white transition-colors duration-300">
              Access to premium technical resources
            </p>
          </div>
          <div className="flex items-start space-x-4 group">
            <CheckCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" />
            <p className="text-base md:text-lg text-gray-200 group-hover:text-white transition-colors duration-300">
              Connect with industry leaders
            </p>
          </div>
          <div className="flex items-start space-x-4 group">
            <CheckCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" />
            <p className="text-base md:text-lg text-gray-200 group-hover:text-white transition-colors duration-300">
              Join exclusive workshops & conferences
            </p>
          </div>
          <div className="flex items-start space-x-4 group">
            <CheckCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0 group-hover:text-blue-300 transition-colors duration-300" />
            <p className="text-base md:text-lg text-gray-200 group-hover:text-white transition-colors duration-300">
              Stay ahead with tech trends
            </p>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          className="mt-12 text-center"
        >
          <button
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold text-lg rounded-full shadow-lg hover:from-blue-500 hover:to-blue-300 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            // onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            onClick={()=>navigate("/login")}
          >
            Continue
            <ArrowRight className="ml-3 h-5 w-5" />
          </button>
        </motion.div>

      </div>
    </motion.div>
  )
}
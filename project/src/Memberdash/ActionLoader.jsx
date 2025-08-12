"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle, XCircle } from "lucide-react"


export default function ActionLoader({ isLoading, actionType, message }) {
  if (!isLoading) return null

  let iconComponent
  let iconColorClass
  let iconKey // Key for AnimatePresence to trigger re-render animation

  switch (actionType) {
    case "approve":
      iconComponent = <CheckCircle />
      iconColorClass = "text-green-600"
      iconKey = "approve"
      break
    case "reject":
      iconComponent = <XCircle />
      iconColorClass = "text-red-600"
      iconKey = "reject"
      break
    case "processing":
    default:
      iconComponent = <Loader2 />
      iconColorClass = "text-blue-600"
      iconKey = "processing"
      break
  }

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={iconKey}
            initial={{ opacity: 0, rotate: actionType === "processing" ? 0 : -90 }}
            animate={{ opacity: 1, rotate: actionType === "processing" ? 360 : 0 }}
            exit={{ opacity: 0, rotate: actionType === "processing" ? 0 : 90 }}
            transition={
              actionType === "processing"
                ? { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }
                : { type: "spring", stiffness: 300, damping: 20 }
            }
            className={`h-12 w-12 ${iconColorClass}`}
          >
            {iconComponent}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={message} // Key for AnimatePresence to trigger re-render animation for text
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 text-gray-700 font-medium text-lg text-center"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}



import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ThankYouPage from "./ThankYouPage";
import PaymentFailedPage from "./PaymentFailedPage";
import { createPaymentOrder, verifyPayment } from "../../Services/ApiServices/ApiService";

const Payment = ({ prevStep }) => {
  const {  handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    // Create a payment order on the backend
    const response = await createPaymentOrder(); // Amount in paise (11800 paise = 118 INR)
    
    if (response.status && response.status === 200) {
      const options = {
        key: response.key, // Replace with your Razorpay key
        amount: response.amount, // Use the amount returned from the backend
        currency: response.currency,
        name: "Membership Registration",
        description: "Payment for Registration",
        image: "https://yourlogo.com/logo.png", // Replace with your logo URL
        order_id: response.order_id, // Use the order ID returned from the backend
        handler: async (paymentResponse) => {
          console.log("Payment successful!", paymentResponse);
          setPaymentId(paymentResponse.razorpay_payment_id);
          alert("Payment Successful! Payment ID: " + paymentResponse.razorpay_payment_id);
          setIsOpen(true);
          setPaymentStatus(true);
              // resetForm();
          // Verify the payment with the backend
          const verificationResponse = await verifyPayment(
            response.order_id,
            paymentResponse.razorpay_payment_id,
            paymentResponse.razorpay_signature,
            
          );

          if (verificationResponse.status && verificationResponse.status === 200) {
            // Navigate to Thank You page with payment ID
            // navigate("/thank-you", { state: { paymentId: paymentResponse.razorpay_payment_id } });
          } else {
            console.error("Payment verification failed:", verificationResponse.message);
            console.log("Payment verification response:", verificationResponse);
            setPaymentStatus(false);
            setIsOpen(true);

            // Navigate to Payment Failed page
            // navigate("/payment-failed", { state: { paymentId: paymentResponse.razorpay_payment_id } });
          }
        },
        prefill: {
          name: response.fullName || "Enter Your Name",
          email: response.email || "Enter Your Email",
          contact: response.phone || "+91 XXXXXXXXXX",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      console.error("Failed to create payment order:", response.message);
      setPaymentStatus(false);
      setIsOpen(true);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 text-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500"
        >
          Secure Payment
        </motion.h2>

        <p className="text-gray-600 mt-3 mb-6 text-lg">
          Complete your registration by making a payment.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
        >
          Pay Now
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevStep}
          className="mt-4 w-full px-6 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
        >
          ← Back
        </motion.button>
      </motion.div>

      {isOpen && (
        // <motion.div
        //   initial={{ opacity: 0 }}
        //   animate={{ opacity: 1 }}
        //   exit={{ opacity: 0 }}
        //   transition={{ duration: 0.5 }}
        //   className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50"
        // >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-8 w-1/2"
          >
            {paymentStatus ? (
              <ThankYouPage transactionNumber={paymentId} />
            ) : (
              <PaymentFailedPage transactionNumber={paymentId} />
            )}
          </motion.div>
        // </motion.div>
      )}
    </div>
  );
};

export default Payment;
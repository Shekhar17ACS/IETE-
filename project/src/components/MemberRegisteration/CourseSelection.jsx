










import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMembershipFees,
  saveSelectedMembership,
  updateFormData,
} from "../Redux/ReduxSlice/membershipFeeSlice"; // Import slice actions
import { toast } from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

const CourseSelection = () => {
  const {  handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const dispatch = useDispatch();
  const { membershipFees, loading, error, formData: reduxFormData } = useSelector(
    (state) => state.membershipFee
  );
  const [formData, setFormData] = useState({ course: "", courseId: null });
  console.log("membershipFees", membershipFees);
  console.log("reduxFormData", reduxFormData);

  // Fetch membership fees on component mount
  useEffect(() => {
    dispatch(fetchMembershipFees());
  }, [dispatch]);

  // Sync Redux formData with local formData
  useEffect(() => {
    if (reduxFormData.course) {
      setFormData({ ...formData, course: reduxFormData.course });
    }
  }, [reduxFormData.course, setFormData, formData]);

  // Handle course selection
  const handleCourseSelect = (courseId, courseName) => {
    dispatch(updateFormData({ name: "course", value: courseName }));
    setFormData({ ...formData, course: courseName, courseId });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.course) {
      toast.error("Please select a membership tier to proceed.");
      return;
    }

    try {
      const result = await dispatch(saveSelectedMembership(formData.courseId)).unwrap();
      // toast.success(result.message || "Membership selection saved successfully!");
      handleNextStep();
    } catch (err) {
      // toast.error(err || "Failed to save membership selection.");
    }
  };

  // Format eligibility criteria based on API data
  const getEligibility = (fee) => {
    const criteria = [];
    if (fee.is_foreign_member) {
      criteria.push("Foreign Member: Yes (any age)");
    } else {
      const ageRange =
        fee.min_age && fee.max_age
          ? `Min Age: ${fee.min_age}, Max Age: ${fee.max_age}`
          : fee.min_age
          ? `Min Age: ${fee.min_age}`
          : fee.max_age
          ? `Max Age: ${fee.max_age}`
          : "Age: Any";
      criteria.push(ageRange);
    }
    if (fee.experience) {
      criteria.push(`Experience: ${fee.experience} years required`);
    }
    criteria.push(`GST: ${fee.gst_percentage}% included`);
    return criteria;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 1, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="max-w-6xl w-full mx-auto my-8 p-6 sm:p-10 bg-gray-100 rounded-3xl overflow-hidden relative"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),transparent)] pointer-events-none" />

      {/* Header */}
      <motion.h2
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="text-4xl sm:text-5xl font-extrabold text-center text-gray-800 mb-12 sm:mb-16 tracking-tight relative"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Choose Your Membership
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 rounded-full -mb-4 opacity-80" />
      </motion.h2>
      {/* More Info Link */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <a
          href="https://www.iete.org/files/IETE-MembershipFee.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg underline transition-colors duration-300"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          For more info, visit this link
        </a>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-600 text-lg">
          Loading membership tiers...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-600 text-lg">
          Error: {error}
        </div>
      )}

      {/* No Data State */}
      {/* {!loading && !error && membershipFees.length === 0 && (
        <div className="text-center text-gray-600 text-lg">
          No membership tiers available.
        </div>
      )} */}

      {/* Course Cards in Two Rows */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {membershipFees?.map((fee, index) => (
            <motion.div
              key={fee.id}
              onClick={() => handleCourseSelect(fee.id, fee.membership_type)}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1), 0 0 30px rgba(79, 70, 229, 0.08)",
              }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.7, ease: "easeOut" }}
              className={`relative p-6 sm:p-8 rounded-2xl border-2 bg-white shadow-lg transition-all duration-500 ${
                formData.course === fee.membership_type
                  ? "border-indigo-300/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 shadow-2xl"
                  : "border-gray-100/80 hover:border-indigo-200 hover:shadow-xl"
              }`}
            >
              {/* Card Content */}
              <div className="text-center">
                <h3
                  className={`text-xl sm:text-2xl font-bold ${
                    formData.course === fee.membership_type ? "text-indigo-700" : "text-gray-900"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {fee.membership_type}
                </h3>
                <p
                  className={`mt-3 text-lg ${
                    formData.course === fee.membership_type ? "text-indigo-600 font-bold" : "text-gray-600 font-bold"
                  }`}
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {fee.currency} {fee.fee_amount}
                </p>

                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCourseSelect(fee.id, fee.membership_type)}
                  className={`mt-6 w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    formData.course === fee.membership_type
                      ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {formData.course === fee.membership_type ? "SELECTED" : `Go WITH ${fee.membership_type}`}
                </motion.button>

                {/* Features List */}
                <div className="mt-8 text-left">
                  <h4
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      formData.course === fee.membership_type ? "text-indigo-600" : "text-gray-500"
                    }`}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Eligibility
                  </h4>
                  <ul className="mt-3 space-y-3">
                    {getEligibility(fee).map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-center text-sm ${
                          formData.course === fee.membership_type ? "text-indigo-600" : "text-gray-600"
                        }`}
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      >
                        <span className="text-indigo-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="w-full py-10 flex flex-col sm:flex-row justify-between items-center mt-12 gap-6 sm:gap-0">
        <motion.button
          whileHover={{ scale: 1.06, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.15)" }}
          whileTap={{ scale: 0.94 }}
          onClick={handlePrevStep}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-full shadow-xl hover:from-gray-900 hover:to-black transition-all duration-500 border border-gray-700/30"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          ← Previous Step
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06, boxShadow: "0 15px 30px rgba(79, 70, 229, 0.3)" }}
          whileTap={{ scale: 0.94 }}
          onClick={handleSubmit}
          disabled={!formData.course || loading}
          className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-full shadow-xl transition-all duration-500 ${
            formData.course && !loading
              ? "bg-indigo-600 text-white hover:from-indigo-700 hover:to-purple-800 border border-indigo-600/40"
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/50"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Confirm & Proceed →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CourseSelection;
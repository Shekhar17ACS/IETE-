

import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  updateFormData,
  updatePersonalDetails,
  fetchPersonalDetails,
} from "../Redux/ReduxSlice/personalDetailsSlice";
import { toast } from "react-hot-toast";
import { sendSMSOtp, verifySMSOtp, getCentres, getSubCentresByCentre, getSubCentres } from "../../Services/ApiServices/ApiService";

const PersonalDetails = () => {
  const { formData, loading } = useSelector((state) => state.personalDetails);
  const { handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const dispatch = useDispatch();
  const [isIndian, setIsIndian] = useState(formData.from_india || true);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(formData.mobile_verified || false);
  const [otpLoading, setOtpLoading] = useState(false);
  const dropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const titleInputRef = useRef(null);
  const [centres, setCentres] = useState([]);
  const [allSubCentres, setAllSubCentres] = useState([]);
  const [filteredSubCentres, setFilteredSubCentres] = useState([]);



  const defaultTitles = [
    "Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Prof.", "Hon.",
    "Engr.", "Capt.", "Col.", "Gen.", "Adv."
  ];

  const isCustomTitle = formData.title && !defaultTitles.includes(formData.title);

  useEffect(() => {
    dispatch(fetchPersonalDetails());
  }, [dispatch]);

  useEffect(() => {
    setIsMobileVerified(formData.mobile_verified || false);
  }, [formData.mobile_verified]);

useEffect(() => {
  const fetchData = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const centresData = await getCentres(token);
      const subCentresData = await getSubCentres(token);

      setCentres(centresData);
      setAllSubCentres(subCentresData);
    } catch (error) {
     
    }
  };

  fetchData();
}, []);

useEffect(() => {
  if (formData?.centre && allSubCentres?.length > 0) {
    const filtered = allSubCentres.filter(
      (sub) => sub.centre?.id === parseInt(formData.centre)
    );
    setFilteredSubCentres(filtered);
  }
}, [formData.centre, allSubCentres]);


  useEffect(() => {
    if (isIndian && (!formData.country || formData.country !== "INDIA")) {
      dispatch(updateFormData({ name: "country", value: "INDIA" }));
    }
  }, [isIndian, formData.country, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = e.target.type === "text" ? value.toUpperCase() : value;
    dispatch(updateFormData({ name, value: newValue }));
    if (name === "country") {
      setIsDropdownOpen(true);
    }
    if (name === "state") {
      setIsStateDropdownOpen(true);
    }
    if (name === "mobile_number" && isMobileVerified) {
      setIsMobileVerified(false);
      setIsOtpSent(false);
      setOtp("");
      dispatch(updateFormData({ name: "mobile_verified", value: false }));
    }
      // Reset sub_centre when centre changes
if (name === "centre") {
  const filtered = allSubCentres.filter(
    (sub) => sub.centre?.id === parseInt(value)
  );
  setFilteredSubCentres(filtered);
  dispatch(updateFormData({ name: "sub_centre", value: "" }));
}
  };

  const handleCountrySelect = (country) => {
    dispatch(updateFormData({ name: "country", value: country.toUpperCase() }));
    setIsDropdownOpen(false);
  };

  const handleStateSelect = (state) => {
    dispatch(updateFormData({ name: "state", value: state.toUpperCase() }));
    setIsStateDropdownOpen(false);
  };

  const handleResetTitle = (e) => {
    e.stopPropagation();
    dispatch(updateFormData({ name: "title", value: "" }));
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.mobile_number) {
      toast.error("Please enter a mobile number!");
      return;
    }
    if (formData.mobile_number.length < 10) {
      toast.error("Mobile number must be at least 10 digits!");
      return;
    }
    setOtpLoading(true);
    try {
      const response = await sendSMSOtp(formData.mobile_number);
      if (response.message === "Phone number already verified") {
        setIsMobileVerified(true);
        dispatch(updateFormData({ name: "mobile_verified", value: true }));
        toast.success("Phone number already verified!");
      } else {
        setIsOtpSent(true);
        toast.success("OTP sent successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP!");
      return;
    }
    setOtpLoading(true);
    try {
      await verifySMSOtp(formData.mobile_number, otp);
      setIsMobileVerified(true);
      setIsOtpSent(false);
      setOtp("");
      dispatch(updateFormData({ name: "mobile_verified", value: true }));
      toast.success("Mobile number verified successfully!");
    } catch (error) {
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMobileVerified) {
      toast.error("Please verify your mobile number!");
      return;
    }

    const today = new Date();
    const dob = new Date(formData.date_of_birth);
    if (dob > today) {
      toast.error("Date of birth cannot be in the future!");
      return;
    }

    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      toast.error("You must be at least 18 years old!");
      return;
    }

    if (isIndian && !formData.state) {
      toast.error("State is required for Indian residents!");
      return;
    }
    if (isIndian && !formData.city) {
      toast.error("City is required for Indian residents!");
      return;
    }
    if (isIndian && !formData.pincode) {
      toast.error("Pincode is required for Indian residents!");
      return;
    }

    if (!formData.title) {
      toast.error("Title is required!");
      return;
    }

    if (
      !formData.name ||
      !formData.last_name ||
      !formData.father_name ||
      !formData.mother_name ||
      !formData.address1 ||
      !formData.address2 ||
      !formData.country ||
      !formData.gender ||
      !formData.date_of_birth
    ) {
      toast.error("All required fields must be filled!");
      return;
    }

    const processedData = { ...formData }; // Remove isMobileVerified since it's read-only
    dispatch(updatePersonalDetails(processedData)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        handleNextStep();
      } else {
        toast.error(result.payload || "Failed to save personal details. Please try again.");
      }
    });
  };

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
    "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
    "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
    "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)",
    "Congo (Kinshasa)", "Cook Islands", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus",
    "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
    "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
    "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
    "Kiribati", "North Korea", "South Korea", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
    "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "North Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
    "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
    "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
    "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
    "Saint Vincentiothe Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan",
    "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
    "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
    "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  const IndianState = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry",
    "Jammu and Kashmir", "Ladakh"
  ];

  const inputVariants = {
    focus: { scale: 1.02, borderColor: "#3B82F6" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-100 rounded-3xl font-sans"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gray-800 mb-6 md:mb-8"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Personal Details
      </motion.h2>

      {error && (
        <p className="text-red-500 text-xs sm:text-sm text-center mb-4">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-gray-500 text-xs sm:text-sm text-center mb-4">
          Loading personal details...
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative col-span-1 sm:col-span-2"
        >
          <label
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Are you Indian Resident?<span style={{ color: "red" }}>*</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const newValue = !isIndian;
                setIsIndian(newValue);
                dispatch(
                  updateFormData({ name: "from_india", value: newValue })
                );
                if (newValue) {
                  dispatch(updateFormData({ name: "country", value: "INDIA" }));
                } else {
                  dispatch(updateFormData({ name: "country", value: "" }));
                  dispatch(updateFormData({ name: "city", value: "" }));
                  dispatch(updateFormData({ name: "state", value: "" }));
                  dispatch(updateFormData({ name: "pincode", value: "" }));
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out ${
                isIndian ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <span className="sr-only">Toggle Indian status</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
                  isIndian ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">
              {isIndian ? "Yes" : "No"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-2">
            {isIndian
              ? "Aadhar card details will be required in the next step."
              : "Aadhar card details are not required for non-Indian residents."}
          </p>
        </motion.div>

        {[
          {
            combined: [
              {
                label: (
                  <span>
                    Title<span style={{ color: "red" }}>*</span>
                  </span>
                ),
                name: "title",
                type: "select",
                options: [
                  { value: "Mr.", label: "Mr." },
                  { value: "Mrs.", label: "Mrs." },
                  { value: "Miss", label: "Miss" },
                  { value: "Ms.", label: "Ms." },
                  { value: "Dr.", label: "Dr." },
                  { value: "Prof.", label: "Prof." },
                  { value: "Hon.", label: "Hon." },
                  { value: "Engr.", label: "Engr." },
                  { value: "Capt.", label: "Capt." },
                  { value: "Col.", label: "Col." },
                  { value: "Gen.", label: "Gen." },
                  { value: "Adv.", label: "Adv." },
                  { value: "Other", label: "Other" },
                ],
              },
              {
                label: (
                  <span>
                    First Name<span style={{ color: "red" }}>*</span>
                  </span>
                ),
                name: "name",
                type: "text",
                placeholder: "Enter First Name",
              },
            ],
          },
          {
            label: "Middle Name (Optional)",
            name: "middle_name",
            type: "text",
            placeholder: "Enter Middle Name (Optional)",
          },
          {
            label: (
              <span>
                Last Name<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "last_name",
            type: "text",
            placeholder: "Enter Last Name",
          },
          {
            label: (
              <span>
                Email<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "email",
            type: "email",
            placeholder: "Enter Email",
            disabled: true,
          },
          {
            label: (
              <span>
                Mobile Number<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "mobile_number",
            type: "number",
            placeholder: "Enter Phone Number",
            disabled: isMobileVerified,
          },
          {
            label: "Landline Number (Optional)",
            name: "landline_no",
            type: "number",
            placeholder: "Enter Landline Number",
          },
          {
            label: (
              <span>
                Father's Name<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "father_name",
            type: "text",
            placeholder: "Enter Father's Name",
          },
          {
            label: (
              <span>
                Mother's Name<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "mother_name",
            type: "text",
            placeholder: "Enter Mother's Name",
          },
          {
            label: "Spouse Name",
            name: "spouse_name",
            type: "text",
            placeholder: "Enter Spouse Name",
          },
          {
            label: (
              <span>
                Date of Birth<span style={{ color: "red" }}>*</span>
              </span>
            ),
            name: "date_of_birth",
            type: "date",
          },
        ].map((field, index) => (
          <motion.div
            key={field.combined ? "title-name" : field.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative"
          >
            {field.combined ? (
              <div className="flex flex-col sm:flex-row gap-2">
                {field.combined.map((subField) => (
                  <div
                    key={subField.name}
                    className={
                      subField.name === "title"
                        ? "w-full sm:w-1/3"
                        : "w-full sm:w-2/3"
                    }
                  >
                    <label
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {subField.label}
                    </label>
                    {subField.name === "title" ? (
                      isCustomTitle || formData.title === "Other" ? (
                        <div className="relative">
                          <motion.input
                            ref={titleInputRef}
                            name="title"
                            type="text"
                            value={
                              formData.title === "Other"
                                ? ""
                                : formData.title || ""
                            }
                            onChange={handleChange}
                            onClick={(e) => e.stopPropagation()}
                            className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                            placeholder="Enter custom title"
                            variants={inputVariants}
                            whileFocus="focus"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          />
                          <div
                            className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer"
                            onClick={handleResetTitle}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-400"
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
                          </div>
                        </div>
                      ) : (
                        <motion.select
                          name="title"
                          value={formData.title || ""}
                          onChange={handleChange}
                          className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                          variants={inputVariants}
                          whileFocus="focus"
                        >
                          <option value="">Select Title</option>
                          {subField.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </motion.select>
                      )
                    ) : (
                      <input
                        type={subField.type}
                        name={subField.name}
                        value={formData[subField.name] || ""}
                        onChange={handleChange}
                        placeholder={subField.placeholder || ""}
                        disabled={subField.disabled || false}
                        className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          ...(subField.disabled
                            ? {
                                backgroundColor: "#e5e7eb",
                                color: "#6b7280",
                                opacity: 0.7,
                                cursor: "not-allowed",
                              }
                            : {}),
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <label
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {field.label}
                </label>
                {field.name === "mobile_number" ? (
                  <div className="relative">
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      placeholder={field.placeholder || ""}
                      disabled={isMobileVerified}
                      className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        ...(isMobileVerified
                          ? {
                              backgroundColor: "#e5e7eb",
                              color: "#6b7280",
                              opacity: 0.7,
                              cursor: "not-allowed",
                            }
                          : {}),
                      }}
                    />
                    {!isMobileVerified && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className={`absolute right-2 top-1 bottom-1 transform -translate-y-0 px-4 py-1.5 text-sm font-medium text-white rounded-md shadow-sm transition-all duration-150 ${
                          otpLoading
                            ? "bg-gray-400 cursor-not-allowed flex items-center gap-2"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {otpLoading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              ></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </motion.button>
                    )}
                    {isMobileVerified && (
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">
                        Verified ✓
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder || ""}
                    disabled={field.disabled || false}
                    className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      ...(field.disabled
                        ? {
                            backgroundColor: "#e5e7eb",
                            color: "#6b7280",
                            opacity: 0.7,
                            cursor: "not-allowed",
                          }
                        : {}),
                    }}
                  />
                )}
                {field.name === "mobile_number" &&
                  isOtpSent &&
                  !isMobileVerified && (
                    <div className="mt-2">
                      <label
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        OTP<span style={{ color: "red" }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading}
                          className={`absolute right-2 top-1 bottom-1 transform -translate-y-0 px-4 py-1.5 text-sm font-medium text-white rounded-md shadow-sm transition-all duration-150  ${
                            otpLoading
                              ? "bg-gray-400 cursor-not-allowed flex items-center gap-2"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {otpLoading ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                              </svg>
                              Verifying...
                            </>
                          ) : (
                            "Verify OTP"
                          )}
                        </motion.button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <label
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
          >
            Gender<span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
          ref={dropdownRef}
        >
          <label
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
          >
            Country/Nation<span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search Country"
            className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
          />
          {isDropdownOpen && (
            <ul
              className="absolute bg-white border-1 border-indigo-200 rounded-sm w-full mt-2 max-h-60 overflow-y-auto shadow-lg"
              style={{ top: "100%", left: 0, zIndex: 10 }}
            >
              {countries
                .filter((country) =>
                  country
                    .toLowerCase()
                    .includes((formData.country || "").toLowerCase())
                )
                .map((country) => (
                  <li
                    key={country}
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-indigo-50 text-sm transition-colors duration-150"
                    onClick={() => handleCountrySelect(country)}
                  >
                    {country}
                  </li>
                ))}
              {countries.filter((country) =>
                country
                  .toLowerCase()
                  .includes((formData.country || "").toLowerCase())
              ).length === 0 && (
                <li className="px-3 sm:px-4 py-2 text-sm text-gray-500">
                  No countries found
                </li>
              )}
            </ul>
          )}
        </motion.div>

        {isIndian && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
              ref={stateDropdownRef}
            >
              <label
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              >
                State<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                onFocus={() => setIsStateDropdownOpen(true)}
                placeholder="Search State"
                className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              />
              {isStateDropdownOpen && (
                <ul
                  className="absolute bg-white border-1 border-indigo-200 rounded-sm w-full mt-2 max-h-60 overflow-y-auto shadow-lg"
                  style={{ top: "100%", left: 0, zIndex: 10 }}
                >
                  {IndianState.filter((state) =>
                    state
                      .toLowerCase()
                      .includes((formData.state || "").toLowerCase())
                  ).map((state) => (
                    <li
                      key={state}
                      className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-indigo-50 text-sm transition-colors duration-150"
                      onClick={() => handleStateSelect(state)}
                    >
                      {state}
                    </li>
                  ))}
                  {IndianState.filter((state) =>
                    state
                      .toLowerCase()
                      .includes((formData.state || "").toLowerCase())
                  ).length === 0 && (
                    <li className="px-3 sm:px-4 py-2 text-sm text-gray-500">
                      No states found
                    </li>
                  )}
                </ul>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <label
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              >
                City<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <label
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              >
                Pincode<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                name="pincode"
                value={formData.pincode || ""}
                onChange={handleChange}
                className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: "300",
                }}
              />
            </motion.div>
          </>
        )}

        {[
          {
            combined: [
              {
                label: (
                  <span>
                    Address Line 1<span style={{ color: "red" }}>*</span>
                  </span>
                ),
                name: "address1",
                type: "text",
                placeholder: "Enter Address Line 1",
              },
              {
                label: (
                  <span>
                    Address Line 2<span style={{ color: "red" }}>*</span>
                  </span>
                ),
                name: "address2",
                type: "text",
                placeholder: "Enter Address Line 2",
              },
              {
                label: "Address Line 3",
                name: "address3",
                type: "text",
                placeholder: "Enter Address Line 3",
              },
            ],
          },
        ].map((field, index) => (
          <motion.div
            key={field.combined ? "address-combined" : field.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 4) * 0.1, duration: 0.5 }}
            className="relative col-span-1 sm:col-span-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <div className="space-y-2">
              {field.combined.map((subField) => (
                <div key={subField.name}>
                  <label
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {subField.label}
                  </label>
                  <input
                    type={subField.type}
                    name={subField.name}
                    value={formData[subField.name] || ""}
                    onChange={handleChange}
                    placeholder={subField.placeholder || ""}
                    className="block w-full px-3 sm:px-4 py-2 border-1 border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
<div className="relative col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Centre Column */}
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2, duration: 0.4 }}
    className="relative"
  >
    <label
      className="text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
    >
      Centre <span className="text-red-600">*</span>
    </label>
    <select
      name="centre"
      value={formData.centre}
      onChange={handleChange}
      className="w-full px-3 sm:px-4 py-2 border border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
    >
      <option value="">Select Centre</option>
      {centres?.map((centre) => (
        <option key={centre.id} value={centre.id}>
          {centre.name}
        </option>
      ))}
    </select>
  </motion.div>

  {/* Sub-Centre Column */}
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3, duration: 0.4 }}
    className="relative"
  >
    <label
      className="text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-2"
      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
    >
      Sub-Centre <span className="text-red-600">*</span>
    </label>
    <select
      name="sub_centre"
      disabled={filteredSubCentres.length === 0}
      value={formData.sub_centre}
      onChange={handleChange}
      className="w-full px-3 sm:px-4 py-2 border border-indigo-200 rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-indigo-200 text-sm transition duration-150 ease-in-out"
      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "300" }}
    >
      <option value="">
        {filteredSubCentres.length > 0
          ? "Select Sub-Centre"
          : "No Sub-Centre"}
      </option>
      {filteredSubCentres.map((sub) => (
        <option key={sub.id} value={sub.id}>
          {sub.name}
        </option>
      ))}
    </select>
  </motion.div>
</div>


        <div className="w-full bg-gray-100 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevStep}
            className="w-full sm:w-auto px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300"
          >
            ← Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300"
          >
            Save and Next →
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default PersonalDetails;
import { configureStore } from "@reduxjs/toolkit";
import { thunk } from "redux-thunk";
import userReducer from "../ReduxSlice/UserSlice"
import forgotPasswordSlice from "../ReduxSlice/ForgotPasswordSlice";
import otpSlice from "../ReduxSlice/OtpSlice"
import LoginSlice from "../ReduxSlice/LoginSlice"
import personalDetailsSlice from "../ReduxSlice/personalDetailsSlice"
import qualificationsSlice from "../ReduxSlice/qualificationsSlice"
import experiencesSlice from "../ReduxSlice/experiencesSlice"
import proposerSlice from "../ReduxSlice/proposerSlice"
import eligibilitySlice from "../ReduxSlice/eligibilitySlice"
import documentSlice from "../ReduxSlice/documentSlice" 
import membershipFeeSlice from "../ReduxSlice/membershipFeeSlice" 
import paymentSlice from "../ReduxSlice/paymentSlice";
import applicationPreviewSlice from "../ReduxSlice/applicationPreviewSlice";
import dashboardStatsSlice from "../ReduxSlice/dashboardStatsSlice";

const store = configureStore({
  reducer: {
    user: userReducer,  // Add reducers here
    forgotPassword: forgotPasswordSlice,  // Add reducers here
    otp: otpSlice,
    LoginUser: LoginSlice,
    personalDetails: personalDetailsSlice,
    qualifications: qualificationsSlice, 
    experiences: experiencesSlice, 
    proposers: proposerSlice,
    eligibility: eligibilitySlice,
    documents: documentSlice, 
    membershipFee: membershipFeeSlice, 
    payment: paymentSlice,
    applicationPreview: applicationPreviewSlice,
    dashboardStats: dashboardStatsSlice,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});

export default store;

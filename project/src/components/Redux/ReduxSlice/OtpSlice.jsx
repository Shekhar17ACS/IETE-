import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import { OtpValidate, resendOtp } from "../../../Services/ApiServices/ApiService";
import { useNavigate } from "react-router-dom";


export const postOtp = createAsyncThunk(
  "otp/postOtp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await OtpValidate(data);

      if (response && response?.application_id) {
        return response;
      } else {
        return rejectWithValue(response.message || "Signup failed");
      }
    } catch (error) {
      
        return rejectWithValue(error.message || "Something went wrong");
      }
    }
);

// Async Thunk for Resending OTP
export const resendOtpThunk = createAsyncThunk(
  "otp/resendOtp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await resendOtp(data);
      if (response && response.success) {
        return response;
      } else {
        return rejectWithValue(response.message || "Resend OTP failed");
      }
    } catch (error) {
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

const initialState = {
  loading: false,
  data: [],
  formData: {
    email: "",
    otp: "",
  },
};

const otpSlice = createSlice({
  name: "otp",
  initialState,
  reducers: {
    UpdateFormData: (state, action) => {
      state.formData[action.payload.name] = action.payload.value;
    },
    resetFormData: (state, action) => {
      state.formData = initialState.formData;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(postOtp.pending, (state,action) => {
        state.loading = true;
      })
      .addCase(postOtp.fulfilled, (state, action) => {

        state.loading = false;
        state.data = action.payload?.data || action.payload; // ✅ Ensure `data` is properly assigned
        toast.success(action.payload?.message || "postOtp successful!");
        
      })
      .addCase(postOtp.rejected, (state, action) => {

        state.loading = false;
        state.error = action.error.message;
        toast.error(action.payload.error);
      })
      .addCase(resendOtpThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(action.payload?.message || "OTP resent successfully!");
      })
      .addCase(resendOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        // toast.error(action.payload.error || "Failed to resend OTP");
      });
  },
});

export const { UpdateFormData, resetFormData } = otpSlice.actions;
export default otpSlice.reducer;
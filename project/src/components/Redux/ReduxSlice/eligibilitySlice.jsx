import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEligibility } from "../../../Services/ApiServices/ApiService"; // Import the API service for checking eligibility
import { toast } from "react-toastify";

// Async Thunk Action for checking eligibility
export const checkEligibility = createAsyncThunk(
  "eligibility/checkEligibility",
  async (token, { getState, rejectWithValue }) => {
    const state = getState();
    if (!token) {
      token = sessionStorage.getItem('token'); // Retrieve token from local storage
    }

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await getEligibility(token); // Call the eligibility API
      if (response.success) {
        return response.data; // Assuming response.data contains eligibility status
      } else {
        return rejectWithValue(response.message || "Eligibility check failed");
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Something went wrong");
      } else {
        return rejectWithValue(error.message || "Something went wrong");
      }
    }
  }
);

const initialState = {
  loading: false,
  eligible: null,
  error: null,
};

const eligibilitySlice = createSlice({
  name: "eligibility",
  initialState,
  reducers: {
    resetEligibility: (state) => {
      state.eligible = null; // Reset eligibility state
      state.error = null; // Reset error state
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkEligibility.pending, (state) => {
        state.loading = true;
        state.error = null; // Reset error on new request
      })
      .addCase(checkEligibility.fulfilled, (state, action) => {
        state.loading = false;
        state.eligible = action.payload; // Store the eligibility status
        toast.success("Eligibility check completed!"); 
      })
      .addCase(checkEligibility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Store the error message
        toast.error(action.payload); // Show error message using toast
      });
  },
});

// Export actions and reducer
export const { resetEligibility } = eligibilitySlice.actions;
export default eligibilitySlice.reducer
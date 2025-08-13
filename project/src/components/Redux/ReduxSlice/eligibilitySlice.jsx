import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEligibility } from "../../../Services/ApiServices/ApiService";
import { toast } from "react-toastify";

export const checkEligibility = createAsyncThunk(
  "eligibility/checkEligibility",
  async (token, { getState, rejectWithValue }) => {
    const state = getState();
    if (!token) {
      token = sessionStorage.getItem("token");
    }

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await getEligibility(token);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Eligibility check failed");
      }
    } catch (error) {
      if (error.response) {
        return rejectWithValue(
          error.response.data.message || "Something went wrong"
        );
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
      state.eligible = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkEligibility.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkEligibility.fulfilled, (state, action) => {
        state.loading = false;
        state.eligible = action.payload;
        toast.success("Eligibility check completed!");
      })
      .addCase(checkEligibility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

// Export actions and reducer
export const { resetEligibility } = eligibilitySlice.actions;
export default eligibilitySlice.reducer;

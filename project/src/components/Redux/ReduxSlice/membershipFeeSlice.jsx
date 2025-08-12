import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMembershipFees, saveMembershipFee } from "../../../Services/ApiServices/ApiService"; // Import API services
import { toast } from "react-hot-toast";

// Async Thunk for fetching membership fees
export const fetchMembershipFees = createAsyncThunk(
  "membershipFee/fetchMembershipFees",
  async (data, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      token = sessionStorage.getItem("token");
    }

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await getMembershipFees(data, token);
     
      if (response) {
        console.log("response2", response);
        return response;
      } else {
        return rejectWithValue(response || "Failed to fetch membership fees");
      }
    } catch (error) {
      console.error("Error fetching membership fees:", error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Something went wrong");
      } else {
        return rejectWithValue(error.message || "Something went wrong");
      }
    }
  }
);

// Async Thunk for saving selected membership
export const saveSelectedMembership = createAsyncThunk(
  "membershipFee/saveSelectedMembership",
  async (membershipFeeId, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      token = sessionStorage.getItem("token");
    }

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await saveMembershipFee(membershipFeeId, token);
      if (response) {
        return response;
      } else {
        return rejectWithValue(response || "Failed to save membership");
      }
    } catch (error) {
      console.error("Error saving membership:", error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Something went wrong");
      } else {
        return rejectWithValue(error.message || "Something went wrong");
      }
    }
  }
);

// Default form data
const defaultFormData = {
  course: "", // Selected membership type (e.g., FELLOW, MEMBER, etc.)
};

const initialState = {
  loading: false,
  error: null,
  membershipFees: [], // Store fetched membership fees
  formData: defaultFormData,
};

const membershipFeeSlice = createSlice({
  name: "membershipFee",
  initialState,
  reducers: {
    updateFormData: (state, action) => {
      state.formData[action.payload.name] = action.payload.value;
    },
    resetFormData: (state) => {
      state.formData = defaultFormData;
    },
  },
  extraReducers: (builder) => {
    // Fetch Membership Fees
    builder
      .addCase(fetchMembershipFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembershipFees.fulfilled, (state, action) => {
        console.log("111", action.payload);
        state.loading = false;
        state.membershipFees = action.payload; // Store fetched membership fees
        // toast.success("Membership fees loaded successfully!");
      })
      .addCase(fetchMembershipFees.rejected, (state, action) => {
        console.log("111", action);
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Save Selected Membership
      .addCase(saveSelectedMembership.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSelectedMembership.fulfilled, (state, action) => {
        state.loading = false;
        toast.success("Membership selection saved successfully!");
      })
      .addCase(saveSelectedMembership.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // toast.error(action.payload);
      });
  },
});

// Export actions and reducer
export const { updateFormData, resetFormData } = membershipFeeSlice.actions;
export default membershipFeeSlice.reducer;
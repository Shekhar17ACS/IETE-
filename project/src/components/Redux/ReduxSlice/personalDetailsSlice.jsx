
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { personalDetails, GetPersonalDetails } from "../../../Services/ApiServices/ApiService"; // Import the API service for updating personal details
import { toast } from "react-hot-toast";

// Async Thunk Action for updating personal details
export const updatePersonalDetails = createAsyncThunk(
  "personalDetails/updatePersonalDetails",
  async (data, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");


    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await personalDetails(data, token); 
      if (response.status && response.status === 200) { 
        return response.data; 
      } else {
        return rejectWithValue(response.message || "Update failed");
      }
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Something went wrong");
      } else {
        return rejectWithValue(error.message || "Something went wrong");
      }
    }
  }
);

// Async Thunk for fetching personal details
export const fetchPersonalDetails = createAsyncThunk(
  "personalDetails/fetchPersonalDetails",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await GetPersonalDetails({}, token); 
      if (response.status === 200) {
        return response.data; 
      } else {
        return rejectWithValue(response.message || "Failed to fetch personal details");
      }
    } catch (error) {
     
      const errorMessage =
        error.response?.data?.message || error.message || "Something went wrong";
      return rejectWithValue(errorMessage);
    }
  }
);

// Default form data
const defaultFormData = {
  title: "",
  custom_title: "",
  name: "",
  middle_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  mobile_verified: false,
  landline_no: "",
  father_name: "",
  mother_name: "",
  spouse_name: "",
  address1: "",
  address2: "",
  address3: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  gender: "",
  date_of_birth: "",
  from_india: true,
};

const initialState = {
  loading: false,
  data: null,
  formData: defaultFormData,
  error: null,
}


const personalDetailsSlice = createSlice({
  name: "personalDetails",
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
    builder
    // Fetch personal details
      .addCase(fetchPersonalDetails.pending, (state) => {
        state.loading = true;
        state.error = null; 
      })
      .addCase(fetchPersonalDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.formData = {...defaultFormData, ...action.payload}; 
        state.data = action.payload;
        })
        .addCase(fetchPersonalDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; 
        toast.error(action.payload); 
        })
      .addCase(updatePersonalDetails.pending, (state) => {
        state.loading = true;
        state.error = null; // Reset error on new request
      })
      .addCase(updatePersonalDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Store the response data
        toast.success("Personal details updated successfully!"); 
      })
      .addCase(updatePersonalDetails.rejected, (state, action) => {

        state.loading = false;
        state.error = action.payload; // Store the error message

      });
  },
});

// Export actions and reducer
export const { updateFormData, resetFormData } = personalDetailsSlice.actions;
export default personalDetailsSlice.reducer;
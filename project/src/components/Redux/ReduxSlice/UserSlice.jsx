import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Resister } from "../../../Services/ApiServices/ApiService";
import { toast } from "react-toastify";

export const SignUp = createAsyncThunk(
  "user/SignUp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await Resister(data);

      if (response.status === 200) {
        return response;
      } else {
        return rejectWithValue(response.message || "Signup failed");
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
  data: [],
  formData: {
    email: "",
    title: "",
    name: "",
    middle_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    // username: "",
    mobile_number: "",
  },
};

const userSlice = createSlice({
  name: "user",
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
      .addCase(SignUp.pending, (state) => {
        state.loading = true;
      })
      .addCase(SignUp.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data || action.payload;
      })
      .addCase(SignUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { UpdateFormData, resetFormData } = userSlice.actions;
export default userSlice.reducer;

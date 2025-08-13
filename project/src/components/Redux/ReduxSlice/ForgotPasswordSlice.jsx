// ForgotPassword.jsx
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  forgotPassword,
  resetPassword,
} from "../../../Services/ApiServices/ApiService";
import { toast } from "react-hot-toast";

const initialState = {
  email: "",
  isLoading: false,
  password: "",
  confirm_password: "",
  error: null,
};

export const forgotPasswordAsync = createAsyncThunk(
  "forgotPassword/forgotPasswordAsync",
  async (email, { rejectWithValue }) => {
    try {
      const response = await forgotPassword({ email });
      if (!response.message) {
        throw new Error(
          response.error || "Failed to send password reset email"
        );
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPasswordAsync = createAsyncThunk(
  "forgotPassword/resetPasswordAsync",
  async (
    { new_password, confirm_password, uidb64, token },
    { rejectWithValue }
  ) => {
    try {
      const response = await resetPassword({
        new_password,
        confirm_password,
        uidb64,
        token,
      });
      if (!response.message) {
        throw new Error(response.error || "Failed to reset password");
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    setEmail(state, action) {
      state.email = action.payload;
    },
    setNewPassword(state, action) {
      state.password = action.payload;
    },
    setConfirmPassword(state, action) {
      state.confirm_password = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(forgotPasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        // toast.success('Password reset link sent to your email!');
        toast.success(action.payload.message); // Use backend message
      })
      .addCase(forgotPasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(resetPasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPasswordAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.password = "";
        state.confirm_password = "";
        // toast.success('Password reset successfully! You can now log in.');
        toast.success(action.payload.message); // Use backend message
      })
      .addCase(resetPasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { setEmail, setNewPassword, setConfirmPassword, clearError } =
  forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;

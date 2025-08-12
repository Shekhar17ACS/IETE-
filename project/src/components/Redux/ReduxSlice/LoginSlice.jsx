
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login } from "../../../Services/ApiServices/ApiService";
import toast from "react-hot-toast";

export const Login = createAsyncThunk(
  "LoginUser/Login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await login(data); // should return { access, refresh }

      if (response.token && response.refresh_token) {
        return response; // Return tokens only
      } else {
        return rejectWithValue("Invalid login Details"); 
      }
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

const initialState = {
  loading: false,
  data: null, // optional, can hold user info later
  token: null, // Access token
  refreshToken: null,
  error: null,
  formData: {
    email: "",
    password: "",
  },
};

const LoginSlice = createSlice({
  name: "LoginUser",
  initialState,
  reducers: {
    UpdateFormData: (state, action) => {
      state.formData[action.payload.name] = action.payload.value;
    },
    resetFormData: (state) => {
      state.formData = initialState.formData;
    },
    logoutUser: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.data = null;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refresh_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(Login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refresh_token;

        sessionStorage.setItem("token", action.payload.token);
        sessionStorage.setItem("refresh_token", action.payload.refresh_token);
        // sessionStorage.setItem("role", action.payload.user.role);
        // sessionStorage.setItem("role", JSON.stringify(action.payload.user.role));
        const role = action.payload.user.role;
        const roleArray = Array.isArray(role) ? role : [role]; 
        sessionStorage.setItem("role", JSON.stringify(roleArray));
        const permissions = action.payload.user.permissions;
        const permissionsArray = Array.isArray(permissions) ? permissions : [permissions]; 
        sessionStorage.setItem("permissions", JSON.stringify(permissionsArray));


        // toast.success("Login successful");
      })
      .addCase(Login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // toast.error(action.payload || "Login failed");
      });
  },
});

export const { UpdateFormData, resetFormData, logoutUser } = LoginSlice.actions;
export default LoginSlice.reducer;

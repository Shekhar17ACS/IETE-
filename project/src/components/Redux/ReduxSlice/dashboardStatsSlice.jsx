import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDashboardStats } from '../../../Services/ApiServices/ApiService';


// Async thunk to fetch dashboard stats
export const fetchDashboardStats = createAsyncThunk(
  'dashboardStats/fetchDashboardStats',
  async (token, { rejectWithValue }) => {
    try {
      const response = await getDashboardStats(token);
      if (response.success === false) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dashboardStatsSlice = createSlice({
  name: 'dashboardStats',
  initialState: {
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    growthRate: 0,
    newUsersThisMonth: 0,
    revenueBreakdown: [],
    recentSignups: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    resetDashboardStats: (state) => {
      state.totalUsers = 0;
      state.activeUsers = 0;
      state.totalRevenue = 0;
      state.growthRate = 0;
      state.newUsersThisMonth = 0;
      state.revenueBreakdown = [];
      state.recentSignups = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.totalUsers = action.payload.total_users;
        state.activeUsers = action.payload.active_users;
        state.totalRevenue = action.payload.total_revenue;
        state.growthRate = action.payload.growth_rate;
        state.newUsersThisMonth = action.payload.new_users_this_month;
        state.revenueBreakdown = action.payload.revenue_breakdown;
        state.recentSignups = action.payload.recent_signups;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch dashboard stats';
      });
  },
});

export const { resetDashboardStats } = dashboardStatsSlice.actions;
export default dashboardStatsSlice.reducer;
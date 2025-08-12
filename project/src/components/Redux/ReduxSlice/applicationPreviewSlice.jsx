
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApplicationPreview } from '../../../Services/ApiServices/ApiService'; // Adjust path to your apiService.js file
import { toast } from 'react-hot-toast';

// Async thunk to fetch application preview data
export const fetchApplicationPreview = createAsyncThunk(
  'applicationPreview/fetchApplicationPreview',
  async ({ token }, { rejectWithValue }) => {
    if (!token) {
      token = sessionStorage.getItem('token');
    }

    if (!token) {
      return rejectWithValue('Please log in again.');
    }

    try {
      const response = await getApplicationPreview(token);
      if (response.success === false) {
        return rejectWithValue(response.message || 'Failed to fetch application preview');
      }
      return response.data; // Return the data object containing personal_details, qualifications, etc.
    } catch (error) {
      console.error('Error fetching application preview:', error);
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch application preview');
      } else {
        return rejectWithValue(error.message || 'Something went wrong');
      }
    }
  }
);

const applicationPreviewSlice = createSlice({
  name: 'applicationPreview',
  initialState: {
    personalDetails: null,
    qualifications: [],
    experiences: [],
    proposers: [],
    areaOfSpecialization: null,
    electronicsExperience: null,
    exposure: null,
    documents: null,
    membershipFee: null,
    approvalStatus: null,
    loading: false,
    error: null,
  },
  reducers: {
    // Optional: Add a reducer to clear the state if needed
    clearApplicationPreview: (state) => {
      state.personalDetails = null;
      state.qualifications = [];
      state.experiences = [];
      state.proposers = [];
      state.areaOfSpecialization = null;
      state.electronicsExperience = null;
      state.exposure = null;
      state.documents = null;
      state.membershipFee = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicationPreview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationPreview.fulfilled, (state, action) => {
        state.loading = false;
        state.personalDetails = action.payload.personal_details || null;
        state.qualifications = action.payload.qualifications || [];
        state.experiences = action.payload.experiences || [];
        state.proposers = action.payload.proposers?.proposers || [];
        state.areaOfSpecialization = action.payload.proposers?.area_of_specialization || null;
        state.electronicsExperience = action.payload.proposers?.electronics_experience || null;
        state.exposure = action.payload.proposers?.exposure || null;
        state.documents = action.payload.documents || null;
        state.membershipFee = action.payload.membership_fee || null;
        // toast.success('Application preview loaded successfully!');
      })
      .addCase(fetchApplicationPreview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // toast.error(action.payload);
      });
  },
});

export const { clearApplicationPreview } = applicationPreviewSlice.actions;
export default applicationPreviewSlice.reducer;
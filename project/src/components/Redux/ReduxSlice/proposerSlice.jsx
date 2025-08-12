

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProposers, createProposer, updateProposer } from '../../../Services/ApiServices/ApiService';

// Async thunks for proposer API operations
export const fetchProposers = createAsyncThunk(
  'proposers/fetchProposers',
  async (token, { rejectWithValue }) => {
    try {
      const response = await getProposers(token);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch proposers');
    }
  }
);


// export const createNewProposer = createAsyncThunk(
//   'proposers/createProposer',
//   async ({ data, token }, { rejectWithValue }) => {
//     try {
//       const response = await createProposer({ proposers: [data] }, token); 
//       return response.data[0]; 
//     } catch (error) {
//       return rejectWithValue(error.message || 'Failed to create proposer');
//     }
//   }
// );
export const createNewProposer = createAsyncThunk(
  'proposers/createProposer',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await createProposer({ proposers: [data] }, token); 
      return response.data; // Return full response (not just proposer)
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create proposer');
    }
  }
);


export const updateExistingProposer = createAsyncThunk(
  'proposers/updateProposer',
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const response = await updateProposer(id, data, token);
      return response.data[0]; // Backend returns array
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update proposer');
    }
  }
);

// Initial state
const initialState = {
  proposers: [],
  loading: false,
  error: null,
   exposure: null,
  electronics_experience: null,
  area_of_specialization: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

// Proposer slice
const proposerSlice = createSlice({
  name: 'proposers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all proposers
    builder
      .addCase(fetchProposers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProposers.fulfilled, (state, action) => {
        state.loading = false;
        state.proposers = action.payload?.results || [];
        state.pagination = {
          count: action.payload?.count || 0,
          next: action.payload?.next || null,
          previous: action.payload?.previous || null,
        };
        console.log("Fetched proposers:", state.proposers);
      })
      .addCase(fetchProposers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create proposer
    builder
      .addCase(createNewProposer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // .addCase(createNewProposer.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.proposers.push(action.payload);
      // })
      .addCase(createNewProposer.fulfilled, (state, action) => {
  state.loading = false;
  const proposer = action.payload.data?.[0];
  if (proposer) {
    state.proposers.push(proposer);
  }

  // Update the 3 new fields
  state.exposure = action.payload.exposure ?? null;
  state.electronics_experience = action.payload.electronics_experience ?? null;
  state.area_of_specialization = action.payload.area_of_specialization ?? null;
})
      .addCase(createNewProposer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update proposer
    builder
      .addCase(updateExistingProposer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExistingProposer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.proposers.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.proposers[index] = action.payload;
        }
        // Update the 3 new fields
        state.exposure = action.payload.exposure ?? null;
        state.electronics_experience = action.payload.electronics_experience ?? null;
        state.area_of_specialization = action.payload.area_of_specialization ?? null;
      })
      .addCase(updateExistingProposer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { clearError } = proposerSlice.actions;
export default proposerSlice.reducer;



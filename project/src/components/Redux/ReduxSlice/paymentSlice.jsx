import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPaymentHistory } from "../../../Services/ApiServices/ApiService";
import { toast } from 'react-hot-toast';

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchPaymentHistory',
  async ({ token, page }, { rejectWithValue }) => {
    if (!token) {
      token = sessionStorage.getItem('token');
    }

    if (!token) {
      return rejectWithValue('Please log in again.');
    }

    try {
      const response = await getPaymentHistory(token, page);
      return {
        results: response.results.map((payment) => ({
          ...payment,
          membership_type: payment.membership_type.replace(/"/g, ''),
        })),
        count: response.count,
        next: response.next,
        previous: response.previous,
      };
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch payment history');
      } else {
        return rejectWithValue(error.message || 'Something went wrong');
      }
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    payments: [],
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    resetPayment: (state) => {
      state.payments = [];
      state.count = 0;
      state.next = null;
      state.previous = null;
      state.currentPage = 1;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.results;
        state.count = action.payload.count;
        state.next = action.payload.next;
        state.previous = action.payload.previous;
        // toast.success('Payment history loaded successfully!');
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // toast.error(action.payload);
      });
  },
});

export const { setCurrentPage, resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
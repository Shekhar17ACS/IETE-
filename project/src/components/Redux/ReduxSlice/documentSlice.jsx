

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createDocument, updateDocument, deleteDocument, getDocuments } from '../../../Services/ApiServices/ApiService'; // Adjust path as needed

// Async thunk for fetching documents
export const fetchDocumentsThunk = createAsyncThunk(
  'documents/fetch',
  async (token, { rejectWithValue }) => {
    try {
      const response = await getDocuments(token);
      console.log('getDocuments response:', response);
      if (response.status === 'success') {
        return response.data; // Backend returns array of documents
      } else {
        return rejectWithValue(response.message || 'Failed to fetch documents');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async thunk for creating a document
export const createDocumentThunk = createAsyncThunk(
  'documents/create',
  async ({ files, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      // Append files to FormData, only if they exist
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.signature) formData.append('signature', files.signature);
      if (files.aadhar_front) formData.append('aadhar_front', files.aadhar_front);
      if (files.aadhar_back) formData.append('aadhar_back', files.aadhar_back);
      if (files.passport) formData.append('passport', files.passport);

      const response = await createDocument(formData, token);
      console.log('createDocument response:', response);
      if (response.status === 'success') {
        return response.data; // Backend returns serialized document
      } else {
        return rejectWithValue(response.message || response.errors || 'Failed to create document');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async thunk for updating a document
export const updateDocumentThunk = createAsyncThunk(
  'documents/update',
  async ({ id, files, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      // Append only provided files for partial update
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      if (files.signature) formData.append('signature', files.signature);
      if (files.aadhar_front) formData.append('aadhar_front', files.aadhar_front);
      if (files.aadhar_back) formData.append('aadhar_back', files.aadhar_back);
      if (files.passport) formData.append('passport', files.passport);

      const response = await updateDocument(id, formData, token);
      console.log('updateDocument response:', response);
      if (response.status === 'success') {
        return response.data;
      } else {
        return rejectWithValue(response.message || response.errors || 'Failed to update document');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Async thunk for deleting a document
export const deleteDocumentThunk = createAsyncThunk(
  'documents/delete',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await deleteDocument(id, token);
      console.log('createDocument response:', response);
      if (response.status === 'success') {
        return id; // Return ID for removal from state
      } else {
        return rejectWithValue(response.message || 'Failed to delete document');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    documents: [], // Array of uploaded documents
    files: {}, // Local files selected in DocumentUpload
    loading: false, // API call status
    error: null, // Error message or object
    uploadStatus: 'idle', // idle | uploading | success | failed
  },
  reducers: {
    setFiles(state, action) {
      state.files = { ...state.files, ...action.payload };
      state.error = null; // Clear errors when files are set
    },
    clearFiles(state) {
      state.files = {};
      state.error = null;
      state.uploadStatus = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Document
    builder
      .addCase(createDocumentThunk.pending, (state) => {
        state.loading = true;
        state.uploadStatus = 'uploading';
        state.error = null;
      })
      .addCase(createDocumentThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadStatus = 'success';
        state.documents.push(action.payload);
        state.files = {}; // Clear files after successful upload
      })
      .addCase(createDocumentThunk.rejected, (state, action) => {
        state.loading = false;
        state.uploadStatus = 'failed';
        state.error = action.payload || 'Failed to upload document';
      });
       // Fetch Documents
    builder
      .addCase(fetchDocumentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload; // Replace documents with fetched data
      })
      .addCase(fetchDocumentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch documents';
      });

    // Update Document
    builder
      .addCase(updateDocumentThunk.pending, (state) => {
        state.loading = true;
        state.uploadStatus = 'uploading';
        state.error = null;
      })
      .addCase(updateDocumentThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadStatus = 'success';
        const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        state.files = {}; // Clear files after successful update
      })
      .addCase(updateDocumentThunk.rejected, (state, action) => {
        state.loading = false;
        state.uploadStatus = 'failed';
        state.error = action.payload || 'Failed to update document';
      });

    // Delete Document
    builder
      .addCase(deleteDocumentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.filter((doc) => doc.id !== action.payload);
      })
      .addCase(deleteDocumentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete document';
      });
  },
});

export const { setFiles, clearFiles, clearError } = documentSlice.actions;
export default documentSlice.reducer;
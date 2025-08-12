

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createExperience,
  updateExperience,
  deleteExperience,
  getExperiences,
} from "../../../Services/ApiServices/ApiService";
import { toast } from "react-hot-toast";

// Async thunk for fetching experiences
export const getExperiencesData = createAsyncThunk(
  "experiences/getExperiencesData",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Authentication required. Please log in.");
    }

    try {
      const response = await getExperiences(token);
   

      // Handle both single and paginated responses
      let experiences = [];
      let pagination = { count: 0, next: null, previous: null };

      if (response.status === "success" && Array.isArray(response.data)) {
        experiences = response.data;
        pagination = response.pagination || pagination;
      } else if (response.results && Array.isArray(response.results)) {
        experiences = response.results;
        pagination = {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
        };
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }

      return { experiences, pagination };
    } catch (error) {
 
      const message = error.response?.data?.message || error.message || "Failed to fetch experiences";
      return rejectWithValue(message);
    }
  }
);

// Async thunk for adding experiences (supports bulk)
export const addExperience = createAsyncThunk(
  "experiences/addExperience",
  async (experienceData, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Authentication required. Please log in.");
    }

    // Convert experienceData to FormData with indexed fields
    const formData = new FormData();
    experienceData.forEach((exp, index) => {
      const idx = index + 1;
      formData.append(`organization_name_${idx}`, exp.organization_name || "");
      formData.append(`employee_type_${idx}`, exp.employee_type || "");
      formData.append(`job_title_${idx}`, exp.job_title || "");
      formData.append(`currently_working_${idx}`, exp.currently_working ? "true" : "false");
      formData.append(`start_date_${idx}`, exp.start_date || "");
      if (!exp.currently_working && exp.end_date) {
        formData.append(`end_date_${idx}`, exp.end_date);
      }
      formData.append(`work_type_${idx}`, exp.work_type || "");
      formData.append(`total_experience_${idx}`, exp.total_experience || "");
    });

    try {
      const response = await createExperience(formData, token);


      if (response.status === "success" && Array.isArray(response.data)) {
        toast.success(response.message || "Experience(s) added successfully!");
        return response.data; // Array of created experiences
      }
      return rejectWithValue(
        response.errors?.join(", ") || response.message || "Failed to add experience(s)"
      );
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to add experience(s)";
      return rejectWithValue(message);
    }
  }
);

// Async thunk for editing an experience
export const editExperience = createAsyncThunk(
  "experiences/editExperience",
  async ({ id, experienceData }, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Authentication required. Please log in.");
    }

    // Prepare data with ID
    const data = { id, ...experienceData };
    if (data.currently_working) {
      delete data.end_date; // Remove end_date if currently working
    }

    try {
      const response = await updateExperience(id, data, token);


      if (response.status === "success" && response.data) {
        toast.success(response.message || "Experience updated successfully!");
        return response.data; // Updated experience object
      }
      return rejectWithValue(
        response.errors?.join(", ") || response.message || "Failed to update experience"
      );
    } catch (error) {

      const message = error.response?.data?.message || error.message || "Failed to update experience";
      return rejectWithValue(message);
    }
  }
);

// Async thunk for deleting an experience
export const removeExperience = createAsyncThunk(
  "experiences/removeExperience",
  async (experienceId, { getState, rejectWithValue }) => {
    const state = getState();
    const token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Authentication required. Please log in.");
    }

    try {
      const response = await deleteExperience(experienceId, token);


      if (response) {
        toast.success(response.message || "Experience deleted successfully!");
        return experienceId; // Return the deleted ID
      }
      return rejectWithValue(response.message );
    } catch (error) {
  
      const message = "Failed to delete experience";
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  loading: false,
  experiences: [],
  formEntries: [
    {
      id: null,
      organization_name: "",
      employee_type: "",
      job_title: "",
      currently_working: false,
      start_date: "",
      end_date: "",
      work_type: "",
      total_experience: "",
    },
  ],
  pagination: { count: 0, next: null, previous: null },
  error: null,
};

// Map API experience to form entry format
const mapExperienceToFormEntry = (exp) => ({
  id: exp.id || null,
  organization_name: exp.organization_name || "",
  employee_type: exp.employee_type || "",
  job_title: exp.job_title || "",
  currently_working: exp.currently_working || false,
  start_date: exp.start_date || "",
  end_date: exp.end_date || "",
  work_type: exp.work_type || "",
  total_experience: exp.total_experience || "",
});

// Experience slice
const experiencesSlice = createSlice({
  name: "experiences",
  initialState,
  reducers: {
    resetExperiences: (state) => {
      state.experiences = [];
      state.formEntries = [{ ...initialState.formEntries[0] }];
      state.pagination = { ...initialState.pagination };
      state.error = null;
    },
    updateExperienceFormEntry: (state, action) => {
      const { index, name, value } = action.payload;
      if (state.formEntries[index]) {
        state.formEntries[index] = { ...state.formEntries[index], [name]: value };
      }
    },

    addExperienceFormEntry: (state) => {
      if (state.formEntries.length < 9) {
        state.formEntries.push({ ...initialState.formEntries[0] });
      } else {
        toast.error("Maximum of 9 experience entries allowed.");
      }
    },
    removeExperienceFormEntry: (state, action) => {
      const index = action.payload;
      state.formEntries = state.formEntries.filter((_, idx) => idx !== index);
      if (state.formEntries.length === 0) {
        state.formEntries.push({ ...initialState.formEntries[0] });
      }
    },
    resetExperienceFormEntries: (state) => {
      state.formEntries = [{ ...initialState.formEntries[0] }];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Experiences
      .addCase(getExperiencesData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExperiencesData.fulfilled, (state, action) => {
        state.loading = false;
        state.experiences = action.payload.experiences;
        state.pagination = action.payload.pagination;
        // Sync formEntries with fetched experiences
        state.formEntries = action.payload.experiences.length
          ? action.payload.experiences.map(mapExperienceToFormEntry)
          : [{ ...initialState.formEntries[0] }];

      })
      .addCase(getExperiencesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.experiences = [];
        state.formEntries = [{ ...initialState.formEntries[0] }];
        toast.error(action.payload);
      })
      // Add Experience
      .addCase(addExperience.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExperience.fulfilled, (state, action) => {
        state.loading = false;
        state.experiences = [...state.experiences, ...action.payload];
        // Update formEntries with new experiences
        state.formEntries = action.payload.map(mapExperienceToFormEntry);

      })
      .addCase(addExperience.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Edit Experience
      .addCase(editExperience.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editExperience.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.experiences.findIndex((exp) => exp.id === action.payload.id);
        if (index !== -1) {
          state.experiences[index] = action.payload;
        }
        // Update corresponding form entry
        const formIndex = state.formEntries.findIndex((entry) => entry.id === action.payload.id);
        if (formIndex !== -1) {
          state.formEntries[formIndex] = mapExperienceToFormEntry(action.payload);
        }
      })
      .addCase(editExperience.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Remove Experience
      .addCase(removeExperience.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeExperience.fulfilled, (state, action) => {
        state.loading = false;
        state.experiences = state.experiences.filter((exp) => exp.id !== action.payload);
        state.formEntries = state.formEntries.filter((entry) => entry.id !== action.payload);
        if (state.formEntries.length === 0) {
          state.formEntries.push({ ...initialState.formEntries[0] });
        }

      })
      .addCase(removeExperience.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

// Export actions and reducer
export const {
  resetExperiences,
  getExperiencesFormEntry,
  updateExperienceFormEntry,
  addExperienceFormEntry,
  removeExperienceFormEntry,
  resetExperienceFormEntries,
} = experiencesSlice.actions;
export default experiencesSlice.reducer;


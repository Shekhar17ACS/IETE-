


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createQualification,
  updateQualification,
  deleteQualification,
  getQualifications,
} from "../../../Services/ApiServices/ApiService";
import { toast } from "react-hot-toast";

// Default form data
const defaultFormData = {
  qualification_type_1: "",
  qualification_branch_1: "",
  institute_name_1: "",
  board_university_1: "",
  year_of_passing_1: "",
  percentage_cgpa_1: "",
  document_1: null,
  id_1: "",
  qualification_type_2: "",
  qualification_branch_2: "",
  institute_name_2: "",
  board_university_2: "",
  year_of_passing_2: "",
  percentage_cgpa_2: "",
  document_2: null,
  id_2: "",
  qualification_type_3: "",
  qualification_branch_3: "",
  institute_name_3: "",
  board_university_3: "",
  year_of_passing_3: "",
  percentage_cgpa_3: "",
  document_3: null,
  id_3: "",
  qualification_type_4: "",
  qualification_branch_4: "",
  institute_name_4: "",
  board_university_4: "",
  year_of_passing_4: "",
  percentage_cgpa_4: "",
  document_4: null,
  id_4: "",
  qualification_type_5: "",
  qualification_branch_5: "",
  institute_name_5: "",
  board_university_5: "",
  year_of_passing_5: "",
  percentage_cgpa_5: "",
  document_5: null,
  id_5: "",
  qualification_type_6: "",
  qualification_branch_6: "",
  institute_name_6: "",
  board_university_6: "",
  year_of_passing_6: "",
  percentage_cgpa_6: "",
  document_6: null,
  id_6: "",
  qualification_type_7: "",
  qualification_branch_7: "",
  institute_name_7: "",
  board_university_7: "",
  year_of_passing_7: "",
  percentage_cgpa_7: "",
  document_7: null,
  id_7: "",
  qualification_type_8: "",
  qualification_branch_8: "",
  institute_name_8: "",
  board_university_8: "",
  year_of_passing_8: "",
  percentage_cgpa_8: "",
  document_8: null,
  id_8: "",
  qualification_type_9: "",
  qualification_branch_9: "",
  institute_name_9: "",
  board_university_9: "",
  year_of_passing_9: "",
  percentage_cgpa_9: "",
  document_9: null,
  id_9: "",
};

// Async thunk for fetching qualifications
export const fetchQualifications = createAsyncThunk(
  "qualifications/fetchQualifications",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      console.error("fetchQualifications: No token available");
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await getQualifications(token);
      console.log("fetchQualifications Response:", response);
      if (response.results) {
        return response.results; // Use paginated results
      } else {
        return rejectWithValue(response.message || "Failed to fetch qualifications");
      }
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

// Async thunk for adding qualifications
export const addQualification = createAsyncThunk(
  "qualifications/addQualification",
  async ({ data }, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      console.error("addQualification: No token available");
      return rejectWithValue("Token is not available. Please log in again.");
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("addQualification: Invalid or empty data", data);
      return rejectWithValue("No valid qualifications provided for creation");
    }

    try {
      const formData = new FormData();
      data.forEach((qual, index) => {
        const i = index + 1;
        if (
          qual.qualification_type &&
          qual.qualification_branch &&
          qual.institute_name &&
          qual.board_university &&
          qual.year_of_passing &&
          qual.percentage_cgpa
        ) {
          formData.append(`qualification_type_${i}`, qual.qualification_type);
          formData.append(`qualification_branch_${i}`, qual.qualification_branch);
          formData.append(`institute_name_${i}`, qual.institute_name);
          formData.append(`board_university_${i}`, qual.board_university);
          formData.append(`year_of_passing_${i}`, qual.year_of_passing);
          formData.append(`percentage_cgpa_${i}`, qual.percentage_cgpa);
          if (qual.document instanceof File) {
            formData.append(`document_${i}`, qual.document);
          }
        }
      });
      formData.append("total", data.length);

      console.log("addQualification FormData:", [...formData.entries()]);

      const response = await createQualification(formData, token);
      console.log("addQualification Response:", response);
      if (response.status === "success") {
        toast.success("Qualification added successfully!");
        return response.data;
      } else {
        return rejectWithValue(response.message || response.errors || "Failed to add qualification");
      }
    } catch (error) {
      console.error("Error adding qualification:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to add qualification");
    }
  }
);

// Async thunk for editing qualifications
export const editQualification = createAsyncThunk(
  "qualifications/editQualification",
  async ({ qualifications }, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      console.error("editQualification: No token available");
      return rejectWithValue("Token is not available. Please log in again.");
    }

    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
      console.error("editQualification: Invalid or empty qualifications array", qualifications);
      return rejectWithValue("No valid qualifications provided for update");
    }

    const invalidQual = qualifications.find(
      (qual) =>
        !qual.id ||
        !qual.qualification_type ||
        !qual.qualification_branch ||
        !qual.institute_name ||
        !qual.board_university ||
        !qual.year_of_passing ||
        !qual.percentage_cgpa
    );
    if (invalidQual) {
      console.error("editQualification: Invalid qualification found", invalidQual);
      return rejectWithValue("All qualifications must have an ID and required fields");
    }

    console.log("editQualification: Qualifications to Update:", qualifications);

    try {
      const response = await updateQualification(qualifications, token);
      console.log("editQualification Response:", response);

      if (response.status === "success") {
        toast.success("Qualification updated successfully!");
        return response.data.length > 0 ? response.data : qualifications;
      } else {
        console.error("editQualification: Backend error", response);
        return rejectWithValue(response.message || "Failed to update qualification");
      }
    } catch (error) {
      console.error("editQualification: Error updating qualification", error);
      return rejectWithValue(error.message || "Failed to update qualification");
    }
  }
);

// Async thunk for deleting qualifications
export const removeQualification = createAsyncThunk(
  "qualifications/removeQualification",
  async (qualificationId, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      console.error("removeQualification: No token available");
      return rejectWithValue("Token is not available. Please log in again.");
    }

    if (!qualificationId) {
      console.error("removeQualification: No qualification ID provided");
      return rejectWithValue("Qualification ID is required for deletion");
    }

    try {
      const response = await deleteQualification(qualificationId, token);
      console.log("removeQualification Response:", response);
      if (response) {
        toast.success("Qualification deleted successfully!");
        return qualificationId;
      } else {
        return rejectWithValue(response.message || "Failed to delete qualification");
      }
    } catch (error) {
      console.error("Error deleting qualification:", error);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

// Initial state
const initialState = {
  loading: false,
  qualifications: [],
  otherQualifications: [],
  formData: defaultFormData,
  error: null,
};

// Qualifications slice
const qualificationsSlice = createSlice({
  name: "qualifications",
  initialState,
  reducers: {
    updateFormData: (state, action) => {
      state.formData[action.payload.name] = action.payload.value;
    },
    resetFormData: (state) => {
      state.formData = defaultFormData;
      state.otherQualifications = [];
    },
    addOtherQualification: (state, action) => {
      if (state.otherQualifications.length < 6) {
        state.otherQualifications.push(action.payload);
      }
    },
    deleteOtherQualification: (state, action) => {
      state.otherQualifications = state.otherQualifications.filter(
        (_, index) => index !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualifications.fulfilled, (state, action) => {
        state.loading = false;
        state.qualifications = action.payload;
        state.otherQualifications = action.payload.slice(3).map((qual) => ({
          qualification_type: qual.qualification_type?.toString() || "",
          qualification_branch: qual.qualification_branch?.toString() || "",
          institute_name: qual.institute_name || "",
          board_university: qual.board_university || "",
          year_of_passing: qual.year_of_passing?.toString() || "",
          percentage_cgpa: qual.percentage_cgpa?.toString() || "",
          document: qual.document || null,
          id: qual.id?.toString() || "",
        }));
        const newFormData = { ...defaultFormData };
        action.payload.forEach((qual, index) => {
          const i = index + 1;
          newFormData[`id_${i}`] = qual.id?.toString() || "";
          newFormData[`qualification_type_${i}`] = qual.qualification_type?.toString() || "";
          newFormData[`qualification_branch_${i}`] = qual.qualification_branch?.toString() || "";
          newFormData[`institute_name_${i}`] = qual.institute_name || "";
          newFormData[`board_university_${i}`] = qual.board_university || "";
          newFormData[`year_of_passing_${i}`] = qual.year_of_passing?.toString() || "";
          newFormData[`percentage_cgpa_${i}`] = qual.percentage_cgpa?.toString() || "";
          newFormData[`document_${i}`] = qual.document || null;
        });
        state.formData = newFormData;
      })
      .addCase(fetchQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to fetch qualifications");
      })
      .addCase(addQualification.pending, (state) => {
        state.loading = true;
      })
      .addCase(addQualification.fulfilled, (state, action) => {
        state.loading = false;
        const newQualifications = Array.isArray(action.payload) ? action.payload : [action.payload];
        const existingIds = new Set(state.qualifications.map((q) => q.id));
        const uniqueNewQuals = newQualifications.filter((qual) => !existingIds.has(qual.id));
        state.qualifications = [...state.qualifications, ...uniqueNewQuals];
        state.otherQualifications = state.qualifications.slice(3).map((qual) => ({
          qualification_type: qual.qualification_type?.toString() || "",
          qualification_branch: qual.qualification_branch?.toString() || "",
          institute_name: qual.institute_name || "",
          board_university: qual.board_university || "",
          year_of_passing: qual.year_of_passing?.toString() || "",
          percentage_cgpa: qual.percentage_cgpa?.toString() || "",
          document: qual.document || null,
          id: qual.id?.toString() || "",
        }));
        const newFormData = { ...defaultFormData };
        state.qualifications.forEach((qual, index) => {
          const i = index + 1;
          newFormData[`id_${i}`] = qual.id?.toString() || "";
          newFormData[`qualification_type_${i}`] = qual.qualification_type?.toString() || "";
          newFormData[`qualification_branch_${i}`] = qual.qualification_branch?.toString() || "";
          newFormData[`institute_name_${i}`] = qual.institute_name || "";
          newFormData[`board_university_${i}`] = qual.board_university || "";
          newFormData[`year_of_passing_${i}`] = qual.year_of_passing?.toString() || "";
          newFormData[`percentage_cgpa_${i}`] = qual.percentage_cgpa?.toString() || "";
          newFormData[`document_${i}`] = qual.document || null;
        });
        state.formData = newFormData;
      })
      .addCase(addQualification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to add qualification");
      })
      .addCase(editQualification.pending, (state) => {
        state.loading = true;
      })
      .addCase(editQualification.fulfilled, (state, action) => {
        state.loading = false;
        const updatedQuals = Array.isArray(action.payload) ? action.payload : [action.payload];
        updatedQuals.forEach((updatedQual) => {
          const index = state.qualifications.findIndex((qual) => qual.id === updatedQual.id);
          if (index !== -1) {
            state.qualifications[index] = updatedQual;
          }
        });
        state.otherQualifications = state.qualifications.slice(3).map((qual) => ({
          qualification_type: qual.qualification_type?.toString() || "",
          qualification_branch: qual.qualification_branch?.toString() || "",
          institute_name: qual.institute_name || "",
          board_university: qual.board_university || "",
          year_of_passing: qual.year_of_passing?.toString() || "",
          percentage_cgpa: qual.percentage_cgpa?.toString() || "",
          document: qual.document || null,
          id: qual.id?.toString() || "",
        }));
        const newFormData = { ...defaultFormData };
        state.qualifications.forEach((qual, index) => {
          const i = index + 1;
          newFormData[`id_${i}`] = qual.id?.toString() || "";
          newFormData[`qualification_type_${i}`] = qual.qualification_type?.toString() || "";
          newFormData[`qualification_branch_${i}`] = qual.qualification_branch?.toString() || "";
          newFormData[`institute_name_${i}`] = qual.institute_name || "";
          newFormData[`board_university_${i}`] = qual.board_university || "";
          newFormData[`year_of_passing_${i}`] = qual.year_of_passing?.toString() || "";
          newFormData[`percentage_cgpa_${i}`] = qual.percentage_cgpa?.toString() || "";
          newFormData[`document_${i}`] = qual.document || null;
        });
        state.formData = newFormData;
      })
      .addCase(editQualification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to update qualification");
      })
      .addCase(removeQualification.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeQualification.fulfilled, (state, action) => {
        state.loading = false;
        state.qualifications = state.qualifications.filter((qual) => qual.id !== action.payload);
        state.otherQualifications = state.qualifications.slice(3).map((qual) => ({
          qualification_type: qual.qualification_type?.toString() || "",
          qualification_branch: qual.qualification_branch?.toString() || "",
          institute_name: qual.institute_name || "",
          board_university: qual.board_university || "",
          year_of_passing: qual.year_of_passing?.toString() || "",
          percentage_cgpa: qual.percentage_cgpa?.toString() || "",
          document: qual.document || null,
          id: qual.id?.toString() || "",
        }));
        const newFormData = { ...defaultFormData };
        state.qualifications.forEach((qual, index) => {
          const i = index + 1;
          newFormData[`id_${i}`] = qual.id?.toString() || "";
          newFormData[`qualification_type_${i}`] = qual.qualification_type?.toString() || "";
          newFormData[`qualification_branch_${i}`] = qual.qualification_branch?.toString() || "";
          newFormData[`institute_name_${i}`] = qual.institute_name || "";
          newFormData[`board_university_${i}`] = qual.board_university || "";
          newFormData[`year_of_passing_${i}`] = qual.year_of_passing?.toString() || "";
          newFormData[`percentage_cgpa_${i}`] = qual.percentage_cgpa?.toString() || "";
          newFormData[`document_${i}`] = qual.document || null;
        });
        state.formData = newFormData;
      })
      .addCase(removeQualification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to delete qualification");
      });
  },
});

// Export actions and reducer
export const {
  updateFormData,
  resetFormData,
  addOtherQualification,
  deleteOtherQualification,
} = qualificationsSlice.actions;
export default qualificationsSlice.reducer;
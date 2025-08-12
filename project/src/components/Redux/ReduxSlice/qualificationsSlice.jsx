



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createQualification,
  updateQualification,
  deleteQualification,
  getQualifications,
} from "../../../Services/ApiServices/ApiService";
import { toast } from "react-hot-toast";

// Default form data with new field naming
const defaultFormData = {
  qualification_type_1: "",
  qualification_branch_1: "",
  institute_name_1: "",
  board_university_1: "",
  year_of_passing_1: "",
  percentage_cgpa_1: "",
  document_1: null,
  qualification_type_2: "",
  qualification_branch_2: "",
  institute_name_2: "",
  board_university_2: "",
  year_of_passing_2: "",
  percentage_cgpa_2: "",
  document_2: null,
  qualification_type_3: "",
  qualification_branch_3: "",
  institute_name_3: "",
  board_university_3: "",
  year_of_passing_3: "",
  percentage_cgpa_3: "",
  document_3: null,
  qualification_type_4: "",
  qualification_branch_4: "",
  institute_name_4: "",
  board_university_4: "",
  year_of_passing_4: "",
  percentage_cgpa_4: "",
  document_4: null,
  qualification_type_5: "",
  qualification_branch_5: "",
  institute_name_5: "",
  board_university_5: "",
  year_of_passing_5: "",
  percentage_cgpa_5: "",
  document_5: null,
  qualification_type_6: "",
  qualification_branch_6: "",
  institute_name_6: "",
  board_university_6: "",
  year_of_passing_6: "",
  percentage_cgpa_6: "",
  document_6: null,
  qualification_type_7: "",
  qualification_branch_7: "",
  institute_name_7: "",
  board_university_7: "",
  year_of_passing_7: "",
  percentage_cgpa_7: "",
  document_7: null,
  qualification_type_8: "",
  qualification_branch_8: "",
  institute_name_8: "",
  board_university_8: "",
  year_of_passing_8: "",
  percentage_cgpa_8: "",
  document_8: null,
  qualification_type_9: "",
  qualification_branch_9: "",
  institute_name_9: "",
  board_university_9: "",
  year_of_passing_9: "",
  percentage_cgpa_9: "",
  document_9: null,
  otherQualifications: [],
};

// Async thunk for fetching qualifications
export const fetchQualifications = createAsyncThunk(
  "qualifications/fetchQualifications",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await getQualifications(token);
      console.log("getQualifications Response:", response);
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
// export const addQualification = createAsyncThunk(
//   "qualifications/addQualification",
//   async ({ data }, { getState, rejectWithValue }) => {
//     const state = getState();
//     let token = state.LoginUser?.token || sessionStorage.getItem("token");

//     if (!token) {
//       return rejectWithValue("Token is not available. Please log in again.");
//     }

//     try {
//       const qualifications = [];
//       for (let i = 1; i <= 9; i++) {
//         if (data[`institute_name_${i}`]) {
//           qualifications.push({
//             qualification_type: data[`qualification_type_${i}`] || "",
//             qualification_branch: data[`qualification_branch_${i}`] || "",
//             institute_name: data[`institute_name_${i}`] || "",
//             board_university: data[`board_university_${i}`] || "",
//             year_of_passing: data[`year_of_passing_${i}`] || "",
//             percentage_cgpa: data[`percentage_cgpa_${i}`] || "",
//             document: data[`document_${i}`],
//           });
//         }
//       }

//       const formData = new FormData();
//       qualifications.forEach((qual, index) => {
//         const i = index + 1; // API expects indices 1 to 9
//         formData.append(`qualification_type_${i}`, qual.qualification_type);
//         formData.append(`qualification_branch_${i}`, qual.qualification_branch);
//         formData.append(`institute_name_${i}`, qual.institute_name);
//         formData.append(`board_university_${i}`, qual.board_university);
//         formData.append(`year_of_passing_${i}`, qual.year_of_passing);
//         formData.append(`percentage_cgpa_${i}`, qual.percentage_cgpa);
//         if (qual.document instanceof File) {
//           formData.append(`document_${i}`, qual.document);
//         }
//       });

//       const response = await createQualification(formData, token);
//       console.log("addQualification Response:", response);
//       if (response.status === "success") {
//         toast.success("Qualification added successfully!");
//         return response.data;
//       } else {
//         return rejectWithValue(response.message || response.errors || "Failed to add qualification");
//       }
//     } catch (error) {
//       console.error("Error adding qualification:", error);
//       return rejectWithValue(error.response?.data?.message || "Failed to add qualification");
//     }
//   }
// );

export const addQualification = createAsyncThunk(
  "qualifications/addQualification",
  async ({ data }, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const qualifications = [];
      for (let i = 1; i <= 9; i++) {
        if (
          data[`institute_name_${i}`] && // Ensure the qualification has meaningful data
          data[`qualification_type_${i}`] &&
          data[`year_of_passing_${i}`] &&
          data[`percentage_cgpa_${i}`]
        ) {
          qualifications.push({
            qualification_type: data[`qualification_type_${i}`] || "",
            qualification_branch: data[`qualification_branch_${i}`] || "",
            institute_name: data[`institute_name_${i}`] || "",
            board_university: data[`board_university_${i}`] || "",
            year_of_passing: data[`year_of_passing_${i}`] || "",
            percentage_cgpa: data[`percentage_cgpa_${i}`] || "",
            document: data[`document_${i}`],
          });
        }
      }

      if (qualifications.length === 0) {
        return rejectWithValue("No valid qualifications to submit.");
      }

      const formData = new FormData();
      qualifications.forEach((qual, index) => {
        const i = index + 1;
        formData.append(`qualification_type_${i}`, qual.qualification_type);
        formData.append(`qualification_branch_${i}`, qual.qualification_branch);
        formData.append(`institute_name_${i}`, qual.institute_name);
        formData.append(`board_university_${i}`, qual.board_university);
        formData.append(`year_of_passing_${i}`, qual.year_of_passing);
        formData.append(`percentage_cgpa_${i}`, qual.percentage_cgpa);
        if (qual.document instanceof File) {
          formData.append(`document_${i}`, qual.document);
        }
      });

      const response = await createQualification(formData, token);
      console.log("addQualification Response:", response);
      if (response.status === "success") {
        toast.success("Qualification added successfully!");
        return response.data; // Expect response.data to be an array of new qualifications
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
// export const editQualification = createAsyncThunk(
//   "qualifications/editQualification",
//   async ({ id, qualificationData }, { getState, rejectWithValue }) => {
//     const state = getState();
//     let token = state.LoginUser?.token || sessionStorage.getItem("token");

//     if (!token) {
//       return rejectWithValue("Token is not available. Please log in again.");
//     }

//     try {
//       const response = await updateQualification(id, qualificationData, token);
//       if (response.status === "success") {
//         toast.success("Qualification updated successfully!");
//         return response.data;
//       } else {
//         return rejectWithValue(response.message || "Failed to update qualification");
//       }
//     } catch (error) {
//       console.error("Error updating qualification:", error);
//       return rejectWithValue(error.message || "Something went wrong");
//     }
//   }
// );

export const editQualification = createAsyncThunk(
  "qualifications/editQualification",
  async ({ id, qualificationData }, { getState, rejectWithValue }) => {
    const state = getState();
    let token = state.LoginUser?.token || sessionStorage.getItem("token");

    if (!token) {
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      // Send as array of objects, each with `id`
      const response = await updateQualification([{ ...qualificationData, id }], token);

      if (response?.status === "success") {
        toast.success("Qualification updated successfully!");
        return response.data?.[0]; // Return the updated item
      } else {
        return rejectWithValue(response.message || "Failed to update qualification");
      }
    } catch (error) {
      console.error("Error updating qualification:", error);
      return rejectWithValue(error?.response?.data?.message || "Something went wrong");
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
      return rejectWithValue("Token is not available. Please log in again.");
    }

    try {
      const response = await deleteQualification(qualificationId, token);
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
    },
    addOtherQualification: (state, action) => {
      if (state.otherQualifications.length < 6) { // Allow up to 6 additional (indices 4-9)
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
        console.log("Fetched Qualifications:", action.payload);
        // Map fetched qualifications to formData
        const newFormData = { ...defaultFormData, otherQualifications: [] };
        state.otherQualifications = [];
        action.payload.forEach((qual, index) => {
          const i = index + 1; // Indices 1 to 9
          newFormData[`qualification_type_${i}`] = qual.qualification_type?.toString() || "";
          newFormData[`qualification_branch_${i}`] = qual.qualification_branch?.toString() || "";
          newFormData[`institute_name_${i}`] = qual.institute_name || "";
          newFormData[`board_university_${i}`] = qual.board_university || "";
          newFormData[`year_of_passing_${i}`] = qual.year_of_passing?.toString() || "";
          newFormData[`percentage_cgpa_${i}`] = qual.percentage_cgpa?.toString() || "";
          newFormData[`document_${i}`] = qual.document || null;
          // Populate otherQualifications for indices 4+ (0-based index 3+)
          if (index >= 3) {
            state.otherQualifications.push({
              qualification_type: qual.qualification_type?.toString() || "",
              qualification_branch: qual.qualification_branch?.toString() || "",
              institute_name: qual.institute_name || "",
              board_university: qual.board_university || "",
              year_of_passing: qual.year_of_passing?.toString() || "",
              percentage_cgpa: qual.percentage_cgpa?.toString() || "",
              document: qual.document || null,
            });
          }
        });
        state.formData = newFormData;
        console.log("Updated formData:", newFormData);
        console.log("Updated otherQualifications:", state.otherQualifications);
      })
      .addCase(fetchQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to fetch qualifications");
      })
      .addCase(addQualification.pending, (state) => {
        state.loading = true;
      })
      // .addCase(addQualification.fulfilled, (state, action) => {
      //   state.loading = false;
      //   const newQualifications = Array.isArray(action.payload) ? action.payload : [action.payload];
      //   state.qualifications.push(...newQualifications);
      //   // Update formData with new qualifications
      //   newQualifications.forEach((qual, index) => {
      //     const formIndex = state.qualifications.length - newQualifications.length + index + 1;
      //     state.formData[`qualification_type_${formIndex}`] = qual.qualification_type?.toString() || "";
      //     state.formData[`qualification_branch_${formIndex}`] = qual.qualification_branch?.toString() || "";
      //     state.formData[`institute_name_${formIndex}`] = qual.institute_name || "";
      //     state.formData[`board_university_${formIndex}`] = qual.board_university || "";
      //     state.formData[`year_of_passing_${formIndex}`] = qual.year_of_passing?.toString() || "";
      //     state.formData[`percentage_cgpa_${formIndex}`] = qual.percentage_cgpa?.toString() || "";
      //     state.formData[`document_${formIndex}`] = qual.document || null;
      //     // Update otherQualifications if index >= 3
      //     if (formIndex > 3) {
      //       state.otherQualifications.push({
      //         qualification_type: qual.qualification_type?.toString() || "",
      //         qualification_branch: qual.qualification_branch?.toString() || "",
      //         institute_name: qual.institute_name || "",
      //         board_university: qual.board_university || "",
      //         year_of_passing: qual.year_of_passing?.toString() || "",
      //         percentage_cgpa: qual.percentage_cgpa?.toString() || "",
      //         document: qual.document || null,
      //       });
      //     }
      //   });
      // })
      .addCase(addQualification.fulfilled, (state, action) => {
  state.loading = false;
  const newQualifications = Array.isArray(action.payload) ? action.payload : [action.payload];
  
  // Filter out duplicates by checking IDs
  const existingIds = new Set(state.qualifications.map((q) => q.id));
  const uniqueNewQuals = newQualifications.filter((qual) => !existingIds.has(qual.id));

  state.qualifications = [...state.qualifications, ...uniqueNewQuals];

  // Update formData with new qualifications
  uniqueNewQuals.forEach((qual, index) => {
    const formIndex = state.qualifications.length - uniqueNewQuals.length + index + 1;
    state.formData[`qualification_type_${formIndex}`] = qual.qualification_type?.toString() || "";
    state.formData[`qualification_branch_${formIndex}`] = qual.qualification_branch?.toString() || "";
    state.formData[`institute_name_${formIndex}`] = qual.institute_name || "";
    state.formData[`board_university_${formIndex}`] = qual.board_university || "";
    state.formData[`year_of_passing_${formIndex}`] = qual.year_of_passing?.toString() || "";
    state.formData[`percentage_cgpa_${formIndex}`] = qual.percentage_cgpa?.toString() || "";
    state.formData[`document_${formIndex}`] = qual.document || null;
    // Update otherQualifications if index >= 3
    if (formIndex > 3) {
      state.otherQualifications.push({
        qualification_type: qual.qualification_type?.toString() || "",
        qualification_branch: qual.qualification_branch?.toString() || "",
        institute_name: qual.institute_name || "",
        board_university: qual.board_university || "",
        year_of_passing: qual.year_of_passing?.toString() || "",
        percentage_cgpa: qual.percentage_cgpa?.toString() || "",
        document: qual.document || null,
      });
    }
  });
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
        const index = state.qualifications.findIndex(
          (qual) => qual.id === action.payload.id
        );
        if (index !== -1) {
          state.qualifications[index] = action.payload;
          // Update formData for the edited qualification
          const i = index + 1;
          state.formData[`qualification_type_${i}`] = action.payload.qualification_type?.toString() || "";
          state.formData[`qualification_branch_${i}`] = action.payload.qualification_branch?.toString() || "";
          state.formData[`institute_name_${i}`] = action.payload.institute_name || "";
          state.formData[`board_university_${i}`] = action.payload.board_university || "";
          state.formData[`year_of_passing_${i}`] = action.payload.year_of_passing?.toString() || "";
          state.formData[`percentage_cgpa_${i}`] = action.payload.percentage_cgpa?.toString() || "";
          state.formData[`document_${i}`] = action.payload.document || null;
          // Update otherQualifications if index >= 3
          if (index >= 3) {
            state.otherQualifications[index - 3] = {
              qualification_type: action.payload.qualification_type?.toString() || "",
              qualification_branch: action.payload.qualification_branch?.toString() || "",
              institute_name: action.payload.institute_name || "",
              board_university: action.payload.board_university || "",
              year_of_passing: action.payload.year_of_passing?.toString() || "",
              percentage_cgpa: action.payload.percentage_cgpa?.toString() || "",
              document: action.payload.document || null,
            };
          }
        }
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
        const index = state.qualifications.findIndex(
          (qual) => qual.id === action.payload
        );
        if (index !== -1) {
          state.qualifications = state.qualifications.filter(
            (qual) => qual.id !== action.payload
          );
          // Rebuild formData after deletion
          const newFormData = { ...defaultFormData, otherQualifications: [] };
          state.otherQualifications = [];
          state.qualifications.forEach((qual, i) => {
            const formIndex = i + 1;
            newFormData[`qualification_type_${formIndex}`] = qual.qualification_type?.toString() || "";
            newFormData[`qualification_branch_${formIndex}`] = qual.qualification_branch?.toString() || "";
            newFormData[`institute_name_${formIndex}`] = qual.institute_name || "";
            newFormData[`board_university_${formIndex}`] = qual.board_university || "";
            newFormData[`year_of_passing_${formIndex}`] = qual.year_of_passing?.toString() || "";
            newFormData[`percentage_cgpa_${formIndex}`] = qual.percentage_cgpa?.toString() || "";
            newFormData[`document_${formIndex}`] = qual.document || null;
            // Rebuild otherQualifications
            if (i >= 3) {
              state.otherQualifications.push({
                qualification_type: qual.qualification_type?.toString() || "",
                qualification_branch: qual.qualification_branch?.toString() || "",
                institute_name: qual.institute_name || "",
                board_university: qual.board_university || "",
                year_of_passing: qual.year_of_passing?.toString() || "",
                percentage_cgpa: qual.percentage_cgpa?.toString() || "",
                document: qual.document || null,
              });
            }
          });
          state.formData = newFormData;
        }
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


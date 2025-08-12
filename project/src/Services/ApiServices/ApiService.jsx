import api from "../../components/api/api";  
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;


const APiUrl = API_BASE_URL || "http://127.0.0.1:8000/api/v1/";


const getApiData = async (apiUrl) => {
  try {
    const response = await api.get(apiUrl,{
      withCredentials:"include"
    });
    return response.data; // Return only relevant data
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return { success: false, message: error.message };
  }
};



const postData = async (apiUrl, data, config = {}) => {
  console.log("data", data, apiUrl);
  try {
    const response = await api.post(apiUrl, data, {
      withCredentials: "include",
      // "Content-Type": "application/json",
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error.message);
    // return { success: false, message: error.message };
      const errRes = error?.response?.data;

    return {
      success: false,
      status: error?.response?.status || 500,
      message: errRes?.message || "Server error occurred.",
    };
  }
};


// Function to update data (PATCH request)
const patchData = async (apiUrl, data, token) => {
  console.log("data", data, apiUrl);
  try {
    const response = await api.patch(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
      withCredentials: "include"
    });
    return response.data;
  } catch (error) {
    console.error("Error updating data:", error.message);
    return { success: false, message: error.message };
  }
}

// Function to fetch data by ID (GET request)
const getDataWithId = async (apiUrl, id) => {
  try {
    const response = await api.get(`${apiUrl}?id=${id}`,{
      withCredentials:"include"
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data by ID:", error.message);
    return { success: false, message: error.message };
  }
};

// Function to update data by ID (PUT request)
const updateDataWithId = async (apiUrl, id, data) => {
  try {
    const response = await api.put(`${apiUrl}?id=${id}`, data,{
      withCredentials:"include"
    });
    return response.data;
  } catch (error) {
    console.error("Error updating data by ID:", error.message);
    return { success: false, message: error.message };
  }
}

const putData = async (apiUrl, data, token) => {
  try {
    const response = await api.put(apiUrl, data, {
      headers: {
        // 'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating data:", error.message);
    return {
      success: false,
      message: error.response?.data?.error || error.message,
    };
  }
};

// Function to delete data by ID (DELETE request)
const deleteDataWithId = async (apiUrl, id) => {
  try {
    const response = await api.delete(`${apiUrl}${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting data by ID:", error.message);
    return { success: false, message: error.message };
  }
};

const deleteConfigData = async (apiUrl, config) => {
  try {
    const response = await api.delete(apiUrl, config);
    return response.data;
  } catch (error) {
    console.error("Error deleting data:", error.message);
    throw error; // Let the caller handle the error
  }
};

// ===========================SignUp ===================
export const Resister = (data) => {
  const apiUrl = `${APiUrl}signup/`;
  return postData(apiUrl, data);
};

// ===========================Forgot Password ===================
export const forgotPassword = (data) => {
  const apiUrl = `${APiUrl}forgot-password/`;
  return postData(apiUrl, data); // Data should be { email: "<email>" }
};

// ===========================Reset Password ===================
export const resetPassword = ({ new_password, confirm_password, uidb64, token }) => {
  const apiUrl = `${APiUrl}reset-password/?uid=${uidb64}&token=${token}`;
  return postData(apiUrl, { new_password, confirm_password });
};

//========================signin ==========================
export const login = (data) => {
    const apiUrl = `${APiUrl}login/`;
    return postData(apiUrl, data)
}

//=======================OTPVerification================
export const OtpValidate = (data) => {
   const apiUrl = `${APiUrl}verify-otp/`
  return postData(apiUrl, data)
}

//======================Resend OTP====================
export const resendOtp = (data) => {
  const apiUrl = `${APiUrl}resend-otp/`
  return postData(apiUrl, data)
}

// =====================Personal Details====================
export const personalDetails = (data, token) => {
  const apiUrl = `${APiUrl}update-personal-details/`;
  return patchData(apiUrl, data, token); 
}

export const GetPersonalDetails = async (token) => {
  const apiUrl = `${APiUrl}update-personal-details/`;
  return getApiData(apiUrl, token);
}
// ===========================Qualification API ===================
const qualificationApiUrl = `${APiUrl}qualification/`;

// Function to fetch all qualifications
export const getQualifications = async (token) => {
  return getApiData(qualificationApiUrl, token);
};

// Function to fetch a qualification by ID
export const getQualificationById = (id, token) => {
  return getDataWithId(qualificationApiUrl, id, token);
};

// Function to create a new qualification
export const createQualification = (data, token) => {
  return postData(qualificationApiUrl, data, token);
};

// Function to update an existing qualification by ID
export const updateQualification = (id, data, token) => {
  return updateDataWithId(qualificationApiUrl, id, data, token);
};

// Function to delete a qualification by ID
export const deleteQualification = (id, token) => {
  return deleteDataWithId(qualificationApiUrl, id, token);
};
// ================================Experience API ===================
const experienceApiUrl = `${APiUrl}experience/`;

export const getExperiences = async (token) => {
  return getApiData(experienceApiUrl, token);
};

// Function to fetch a specific experience by ID
export const getExperienceById = async (id, token) => {
  return getDataWithId(experienceApiUrl, id, token);
};

// Function to create a new experience
export const createExperience = async (data, token) => {
  return postData(experienceApiUrl, data, token);
};

// Function to update an existing experience by ID
export const updateExperience = async (id, data, token) => {
  return updateDataWithId(experienceApiUrl, id, data, token);
};

// Function to delete an experience by ID
export const deleteExperience = async (id, token) => {
  return deleteDataWithId(experienceApiUrl, id, token);
};

// ===========================Proposer API ===================
const proposerApiUrl = `${APiUrl}proposers/`;

// Function to fetch all proposers
export const getProposers = async (token) => {
  return getApiData(proposerApiUrl, token);
};

// Function to fetch a proposer by ID
export const getProposerById = (id, token) => {
  return getDataWithId(proposerApiUrl, id, token);
};

// Function to create a new proposer
export const createProposer = (data, token) => {
  return postData(proposerApiUrl, data, token);
};

// Function to update an existing proposer by ID
export const updateProposer = (id, data, token) => {
  return updateDataWithId(proposerApiUrl, id, data, token);
};

// Function to delete a proposer by ID
export const deleteProposer = (id, token) => {
  return deleteDataWithId(proposerApiUrl, id, token);
};

const proposerActionApiUrl = `${APiUrl}proposers/action/`;
export const getPublicData = (url) => api.get(url).then(res => res.data);

export const actOnProposer = (token, action) => {
  const url = `${proposerActionApiUrl}?token=${token}&action=${action}`;
  return getPublicData(url);
};


// ===========================Payment API ===================

// Function to create a payment order
export const createPaymentOrder = (amount) => {
  const apiUrl = `${APiUrl}create-order/`; // Directly using the endpoint
  return postData(apiUrl, { amount });
};

// Function to verify a payment
export const verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const apiUrl = `${APiUrl}verify-payment/`; // Directly using the endpoint
  return postData(apiUrl, {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
};

// ===========================Eligibility API ===================
const eligibilityApiUrl = `${APiUrl}eligibility/`;

// Function to fetch eligibility data
export const getEligibility = async (token) => {
  return getApiData(eligibilityApiUrl, token);
};

// ===========================Documents API ===================
const documentsApiUrl = `${APiUrl}documents/`;

// Function to fetch all documents
export const getDocuments = async (token) => {
  return getApiData(documentsApiUrl, token);
};

// Function to fetch a document by ID
export const getDocumentById = async (id, token) => {
  return getDataWithId(documentsApiUrl, id, token);
};

// Function to create a new document
export const createDocument = async (data, token) => {
  return postData(documentsApiUrl, data, token);
};

// Function to update an existing document by ID
export const updateDocument = async (id, data, token) => {
  return updateDataWithId(documentsApiUrl, id, data, token);
};

// Function to delete a document by ID
export const deleteDocument = async (id, token) => {
  return deleteDataWithId(documentsApiUrl, id, token);
};

// ===========================Membership Fee API ===================
const membershipFeeApiUrl = `${APiUrl}membership-fee/`;

// Function to fetch all membership fees
export const getMembershipFees = async () => {
  const token = sessionStorage.getItem('token'); 
  return getApiData(membershipFeeApiUrl, token);
};


// ===========================Membership Fee API ===================
const membershipFeeIdApiUrl = `${APiUrl}save-membership/`;

// Function to save membership fee
export const saveMembershipFee = async (membershipFeeId) => {
  const apiUrl = `${membershipFeeIdApiUrl}?membership_fee=${membershipFeeId}`;
  const token = sessionStorage.getItem('token');
  
  // Call the postData function with the constructed URL
  return postData(apiUrl, token, {}); // No body data is needed for this request
};

// ===========================Payment History API ===================
const paymentHistoryApiUrl = `${APiUrl}payment-history/`;

// Function to fetch payment history (all payments, with optional pagination)
export const getPaymentHistory = async (token, page = null) => {
  const apiUrl = page ? `${paymentHistoryApiUrl}?page=${page}` : paymentHistoryApiUrl;
  return getApiData(apiUrl, token);
};

// Function to fetch a specific payment by ID
export const getPaymentById = async (id, token) => {
  const apiUrl = `${paymentHistoryApiUrl}?id=${id}`;
  return getApiData(apiUrl, token);
};

// ===========================Application Preview API ===================
const applicationPreviewApiUrl = `${APiUrl}application-preview/`;

// Function to fetch application preview data
export const getApplicationPreview = async (token) => {
  return getApiData(applicationPreviewApiUrl, token);
};

// ===========================Payment Status API ===================
const paymentStatusApiUrl = `${APiUrl}payment-status/`;

// Function to fetch payment status
export const getPaymentStatus = async (token) => {
  return getApiData(paymentStatusApiUrl, token);
};

// =========================== Role List API ===================
const roleListApiUrl = `${APiUrl}all-roles/`;

// Function to fetch role list (updated within last 7 days)
export const getRoleList = async (token) => {
  return getApiData(roleListApiUrl, token);
};

// =========================== Role API ===================
const rolesApiUrl = `${APiUrl}roles/`;

// Function to fetch all roles (with pagination)
export const getRoles = async (token, page = null) => {
  const apiUrl = page ? `${rolesApiUrl}?page=${page}` : rolesApiUrl;
  const response = await getApiData(apiUrl, token);
  if (response.success === false) return response;
  // Handle pagination response { results, next, previous, count }
  return Array.isArray(response.results) ? response.results : response;
};

// Function to create a new role
export const createRole = async (data, token) => {
  return postData(rolesApiUrl, { name: data.name }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: "include",
  });
};

// Function to update an existing role
export const updateRole = async (id, data, token) => {
  const apiUrl = `${rolesApiUrl}${id}/`;
  return patchData(apiUrl, { name: data.name }, token);
};

// Function to delete roles (single or multiple)
export const deleteRoles = async (ids, token) => {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const response = await deleteDataWithId(rolesApiUrl, id, token);
        // Infer success based on response content
        const isSuccess =
          response.message === "Role deleted successfully" || !!response.deleted_role;
        return {
          id,
          success: isSuccess,
          message: response.message || (isSuccess ? "Deleted successfully" : "Failed to delete"),
        };
      } catch (error) {
        return {
          id,
          success: false,
          message: error.message || "Failed to delete due to network error",
        };
      }
    })
  );

  const hasErrors = results.some((result) => !result.success);
  return {
    success: !hasErrors,
    results,
    message: hasErrors ? "Some roles failed to delete" : "All roles deleted successfully",
  };
};

// =========================== Permission Matrix API ===================
const permissionMatrixApiUrl = `${APiUrl}permissions-matrix/`;

// Function to fetch permission matrix
export const getPermissionMatrix = async (token) => {
  return getApiData(permissionMatrixApiUrl, token);
};




export const togglePermission = async (data, token) => {
  try {
    const response = await api.post(permissionMatrixApiUrl, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: "include"
    });
    return response.data;
  } catch (error) {
    console.error("Error toggling permission:", error.message);
    return { success: false, message: error.message };
  }
};


export const bulkUpdatePermissions = async (data, token) => {
  try {
    const response = await api.patch(permissionMatrixApiUrl, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: "include"
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk updating permissions:", error.message);
    return { success: false, message: error.message };
  }
};

// ===========================Employee Management API ===================
const employeesApiUrl = `${APiUrl}add-member/`;

export const getEmployees = async (token) => {
  return getApiData(employeesApiUrl, token);
};

export const getEmployee = async (employeeId, token) => {
  const apiUrl = `${employeesApiUrl}${employeeId}/`;
  return getApiData(apiUrl, token);
};

export const createEmployee = async (data, token) => {
  return postData(employeesApiUrl, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createBulkEmployees = async (data, token) => {
  return postData(employeesApiUrl, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateEmployee = async (employeeId, data, token) => {
  const apiUrl = `${employeesApiUrl}${employeeId}/`;
  return updateDataWithId(apiUrl, employeeId, data, token);
};

export const deleteEmployee = async (employeeId, token) => {
  return deleteDataWithId(employeesApiUrl, employeeId, token);
};

// ===========================Admin Logs API ===================
const adminLogsApiUrl = `${APiUrl}logs/`;

// Function to fetch admin logs
export const getAdminLogs = async () => {
  try {
    const response = await api.get(adminLogsApiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin logs:", error.message);
    return { success: false, message: error.message };
  }
};



// =========================== Change Password API ===================
export const changePassword = async (data, token) => {
  const apiUrl = `${APiUrl}change-password/`;
  return postData(apiUrl, data, {
    headers: { Authorization: `Bearer ${token}`}    
  });
};


//============================avatar update ==========================
export const updatePersonalDetails = async (data, token) => {
  const apiUrl = `${APiUrl}update-personal-details/`;
  const formData = new FormData();
  
  if (data.department) formData.append("department", data.department);
  if (data.file) formData.append("avatar", data.file); // File for ImageField

  return patchData(apiUrl, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type; let the browser set it for FormData
    },
    method: "PATCH", // Override postData to use PATCH
  });
};

export const GetPersonalDetailsProfile = async (token) => {
  const apiUrl = `${APiUrl}update-personal-details/`;
  return getApiData(apiUrl, token);
}


// =========================== Application List API ===================
const applicationListApiUrl = `${APiUrl}applications/`;

// Function to fetch all applications
export const getApplications = async (token) => {
  return getApiData(applicationListApiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const saveApplicationVerification = async (data, token) => {
  const { user, ...restData } = data; // Extract user and other fields
  const url = `${applicationListApiUrl}?user_id=${user}`; // Append user_id to query string
  return postData(url, restData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateApplicationVerification = async (data, token) => {
    const { user, ...restData } = data;
    const updatedData = { user_id: user, ...restData };
    return putData(applicationListApiUrl, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
    });
};


// =========================== Approve Membership API ===================
const approveMembershipApiUrl = `${APiUrl}memberships/`;

// Function to approve or reject membership
export const approveMembership = async (data, token) => {
  return postData(approveMembershipApiUrl, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// =========================== Config Settings API ===================
const configSettingsApiUrl = `${APiUrl}config-settings/`;


export const getConfigSetting = async ({ id = null, type = "membership" }, token) => {
  const query = id ? `?id=${id}` : `?type=${type}`;
  return getApiData(`${configSettingsApiUrl}${query}`, token);
};


export const saveConfigSetting = async (data, token, type = "membership") => {
  const apiUrl = `${configSettingsApiUrl}?type=${type}`;
  return postData(apiUrl, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const updateConfigSetting = async (data, token) => {
  return patchData(configSettingsApiUrl, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const deleteConfigSetting = async ({ id, type = "membership" }, token) => {
  const url = `${configSettingsApiUrl}?id=${id}&type=${type}`;
  return deleteConfigData(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


// =================Certificate API==============
const certificateApiUrl = `${APiUrl}certificate/`;

export const generateCertificate = async (name, token, email = "") => {
  const params = new URLSearchParams({ name });
  if (email) params.append("email", email);

  const apiUrl = `${certificateApiUrl}?${params.toString()}`;
  return postData(apiUrl, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};





// =========================== Member Report Export API ===================
// const memberReportApiUrl = `${APiUrl}members/reports/`;

const memberReportApiUrl = `${APiUrl}members/reports/`;

// Function to export member reports
export const exportMemberReport = async (format, fields = [], name = null, start_date = null, end_date = null, token) => {
  try {
    const data = { format, fields };

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: "include",
      responseType: "blob", // Use blob for all file types
    };

    let apiUrl = memberReportApiUrl;
    const params = new URLSearchParams();
    if (name) params.append('name', encodeURIComponent(name));
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (params.toString()) apiUrl += `?${params.toString()}`;

    const response = await api.post(apiUrl, data, config);

    // Validate response
    if (!response.data || response.data.size === 0) {
      throw new Error("Received empty response from server.");
    }

    // Map format to Content-Type
    const contentTypeMap = {
      csv: "text/csv",
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };
    const contentType = response.headers["content-type"] || contentTypeMap[format] || "application/octet-stream";

    // Check if response is JSON (indicating an error)
    if (contentType.includes("application/json")) {
      const text = await new Response(response.data).text();
      let errorMessage = "Unknown error occurred.";
      try {
        const parsedError = JSON.parse(text);
        errorMessage = parsedError.detail || errorMessage;
      } catch {
        errorMessage = "Invalid response format from server.";
      }
      throw new Error(errorMessage);
    }

    // Extract filename from Content-Disposition or use fallback
    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || `members.${format}`
      : `members.${format}`;

    // Create Blob with explicit type
    const blob = new Blob([response.data], { type: contentType });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Member report exported successfully as ${format}`,
    };
  } catch (error) {
    console.error("Error exporting member report:", error.message);
    return {
      success: false,
      status: error?.response?.status || 500,
      message: error.message || "Failed to export member report.",
    };
  }
};



// =========================== Approval Status API ===================
const approvalStatusApiUrl = `${APiUrl}membership/status/`;

// Function to fetch membership approval status
export const getApprovalStatus = async (status, token) => {
  const apiUrl = `${approvalStatusApiUrl}?status=${status}`;
  return getApiData(apiUrl, { headers: { Authorization: `Bearer ${token}` },
  });
};


// =========================== ID Card and Certificate API ===================
const idCardCertificateApiUrl = `${APiUrl}user/id-certificate/`;

// Function to fetch ID card, certificate, or both
export const getIdCardAndCertificate = async (type = "", token) => {
  try {
    const apiUrl = type ? `${idCardCertificateApiUrl}?type=${type}` : idCardCertificateApiUrl;
    const response = await api.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: "include",
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching ID card/certificate:", error.message);
    return {
      success: false,
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || "Failed to fetch ID card/certificate.",
    };
  }
};








// ===========================Pending Payments API ===================
const pendingPaymentsApiUrl = `${APiUrl}payments/pending-verify/`;

// Get all pending payments (GET)
export const getPendingPayments = async (token) => {
  return getApiData(pendingPaymentsApiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Verify multiple payments (POST)
export const verifyPendingPayments = async (payment_ids, token) => {
  return postData(pendingPaymentsApiUrl, { payment_ids }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ===========================Payment Receipts API ===================
const paymentReceiptsApiUrl = `${APiUrl}payment-receipt/`;

// Generate receipts and optionally send emails (POST)
export const generatePaymentReceipts = async ({ payment_ids, send_email = false }, token) => {
  return postData(paymentReceiptsApiUrl, { payment_ids, send_email }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ===========================SMS OTP APIs ===================
const sendSMSOtpApiUrl = `${APiUrl}send-sms/`;
const verifySMSOtpApiUrl = `${APiUrl}verify-sms/`;


// Send OTP via SMS
export const sendSMSOtp = async (phone) => {
  const apiUrl = sendSMSOtpApiUrl;
  return postData(apiUrl, { phone });
};

// Verify OTP from SMS
export const verifySMSOtp = async (phone, otp) => {
  const apiUrl = verifySMSOtpApiUrl;
  return postData(apiUrl, { phone, otp });
};


// Function to fetch the Qualification Type
const qualificationTypeUrl=`${APiUrl}qualification-type/`;

export const getQualificationType = async (token) => {
  return getApiData(qualificationTypeUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Function to fetch the Qualification Branch
const qualificationBranchUrl=`${APiUrl}qualification-branch/`;
export const getQualificationBranch = async (token) => {
  return getApiData(qualificationBranchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// =========================== Centres API ===================
const centresApiUrl = `${APiUrl}centre/`;

export const getCentres = async (token) => {
  return getApiData(centresApiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// =========================== Sub-Centres API ===================
const subCentresApiUrl = `${APiUrl}sub-centre/`;

export const getSubCentres = async (token) => {
  return getApiData(subCentresApiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Function to fetch sub-centres by centre ID
const subCentreByCentreApiUrl = `${APiUrl}sub-centre/`;

export const getSubCentresByCentre = async (centreId, token) => {
  const url = `${subCentreByCentreApiUrl}?centre_id=${centreId}`;
  return getApiData(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// =========================== Application Tracker API ===================
const applicationTrackerApiUrl = `${APiUrl}application-tracker/`;

// Function to fetch application tracker data
export const getApplicationTracker = async (token) => {
  return getApiData(applicationTrackerApiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
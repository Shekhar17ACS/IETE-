

import React, { useState, useEffect } from "react";
import { getApprovalStatus } from "../Services/ApiServices/ApiService"; // Adjust path as needed
import { Loader2, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react";

const ApprovalStatus = () => {
  const [status, setStatus] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApprovalStatus = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovalStatus(status, token);
      if (response.success === false) {
        setError(response.message || "Failed to fetch data.");
        setData(null);
      } else {
        setData(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      setError("Failed to fetch data. Please ");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token"); // Retrieve token from sessionStorage
    if (token) {
      fetchApprovalStatus(token);
    } else {
      setError("Authentication token is missing. Please log in.");
      setLoading(false);
    }
  }, [status]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Filter className="w-6 h-6 text-blue-600" />
            Membership Approval Status
          </h1>
          <div className="flex gap-2">
            {["all", "approved", "rejected"].map((type) => (
              <button
                key={type}
                onClick={() => handleStatusChange(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* {error && (
          <div className="div className="flex items-center gap-2 p-4 bg-red-100 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )} */}

        {data && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Approved By</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Remark</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.applicant_id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 text-gray-700">{item.applicant_name}</td>
                    <td className="p-3">
                      {item.success ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">
                      {item.approved_by && item.approved_by.length > 0 ? (
                        <div>
                          {item.approved_by.map((approver, index) => (
                            <div key={index} className="mb-2">
                              <p>{approver.name}</p>
                              <p className="text-sm text-gray-500">
                                {approver.email || "N/A"}
                              </p>
                              <p className="text-sm text-indigo-600 font-medium">
                                {approver.role || "N/A"}
                              </p>
                              {/* <p className="text-sm text-indigo-600 font-medium">
                                {approver.remarks || "N/A"}
                              </p> */}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    {/* <td className="p-3 text-gray-700">{item.remarks || "N/A"}</td> */}
                    <td className="p-3 text-gray-700">
                      {item.approved_by && item.approved_by.length > 0 ? (
                        item.approved_by.map((approver, index) => (
                          <p key={index} className="text-sm text-indigo-600 font-medium">
                            {approver.remarks || "N/A"}
                          </p>
                        ))
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="p-3 text-gray-700">
                      {item.submitted_at
                        ? new Date(item.submitted_at).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-gray-600">
              Total Records: <span className="font-semibold">{data.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalStatus;







import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Clock, XCircle, AlertCircle, Lock, Download } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getApplicationTracker } from "../Services/ApiServices/ApiService"; // Adjust path to your apiservices.js

// TypeScript interfaces for type safety
// interface Step {
//   id: string;
//   title: string;
//   status: string;
//   date: string | null;
// }

// interface TrackerData {
//   applicationNo: string;
//   email: string;
//   userId: string | null;
//   date: string;
//   status: string;
//   isApproved: boolean;
//   paymentStatus: string;
//   amount: number;
//   steps: Step[];
// }

// Component
const FormTracker = () => {
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch tracker data on mount
  useEffect(() => {
    const fetchTrackerData = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await getApplicationTracker(token);
        if (response.success === false) {
          setError(response.message || "Failed to fetch application tracker data.");
        } else {
          setTrackerData(response);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackerData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Export functionality
  const handleExport = (format) => {
    if (!trackerData) return;

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Application Tracker", 14, 20);
      doc.setFontSize(12);
      doc.text(`Application No: ${trackerData.applicationNo}`, 14, 30);
      doc.text(`Email: ${trackerData.email}`, 14, 38);
      doc.text(`User ID: ${trackerData.username || "Not Assigned"}`, 14, 46);
      doc.text(
        `Application Date: ${new Date(trackerData.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        54
      );
      doc.text(`Status: ${trackerData.status}`, 14, 62);
      doc.text(`Admin Approval: ${trackerData.isApproved ? "Approved" : "Pending"}`, 14, 70);
      doc.text(`Payment Status: ${trackerData.paymentStatus}`, 14, 78);
      doc.text(`Amount: ₹${trackerData.amount.toLocaleString()}`, 14, 86);

      // Steps table
      autoTable(doc, {
        startY: 94,
        head: [["Step", "Status", "Date"]],
        body: trackerData.steps.map((step) => [
          step.title,
          step.status,
          step.date
            ? new Date(step.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "N/A",
        ]),
      });

      doc.save("Application_Tracker.pdf");
    } else if (format === "excel") {
      const wsData = [
        {
          ApplicationNo: trackerData.applicationNo,
          Email: trackerData.email,
          UserID: trackerData.username || "Not Assigned",
          ApplicationDate: new Date(trackerData.date).toLocaleDateString("en-US"),
          Status: trackerData.status,
          AdminApproval: trackerData.isApproved ? "Approved" : "Pending",
          PaymentStatus: trackerData.paymentStatus,
          Amount: trackerData.amount,
        },
        ...trackerData.steps.map((step) => ({
          Step: step.title,
          StepStatus: step.status,
          StepDate: step.date ? new Date(step.date).toLocaleDateString("en-US") : "N/A",
        })),
      ];
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Application Tracker");
      XLSX.writeFile(wb, "Application_Tracker.xlsx");
    } else if (format === "csv") {
      const csvData = [
        "ApplicationNo,Email,UserID,ApplicationDate,Status,AdminApproval,PaymentStatus,Amount",
        `${trackerData.applicationNo},${trackerData.email},${trackerData.username || "Not Assigned"},${new Date(
          trackerData.date
        ).toLocaleDateString("en-US")},${trackerData.status},${trackerData.isApproved ? "Approved" : "Pending"},${
          trackerData.paymentStatus
        },${trackerData.amount}`,
        "",
        "Step,Status,Date",
        ...trackerData.steps.map(
          (step) =>
            `${step.title},${step.status},${step.date ? new Date(step.date).toLocaleDateString("en-US") : "N/A"}`
        ),
      ].join("\n");
      const blob = new Blob([csvData], { type: "text/csv" });
      saveAs(blob, "Application_Tracker.csv");
    }
    setDropdownOpen(false);
  };

  // Status icon renderer
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "pending":
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "failed":
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  // Status badge renderer
  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">In Progress</span>;
      case "Completed":
        return <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Completed</span>;
      case "Pending":
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">Pending</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">{status}</span>;
    }
  };

  // Payment status badge renderer
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "Success":
        return <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Success</span>;
      case "Pending":
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">Pending</span>;
      case "Failed":
        return <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">Failed</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">{status}</span>;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-medium text-gray-600">Loading application tracker...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render when no data (unlikely, but for safety)
  if (!trackerData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-medium text-gray-600">No application data available.</div>
      </div>
    );
  }

  // Main render
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Application Tracker</h2>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-700"
              onClick={() => setDropdownOpen(!isDropdownOpen)}
            >
              <Download className="h-5 w-5" /> Export
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleExport("pdf")}
                >
                  PDF
                </button>
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleExport("excel")}
                >
                  Excel
                </button>
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleExport("csv")}
                >
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="mb-8 grid gap-4 rounded-lg bg-gray-50 p-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Application No</h3>
            <p className="text-lg font-semibold">{trackerData.applicationNo}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="text-lg font-semibold">{trackerData.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">User Name</h3>
            {trackerData.username ? (
              <p className="text-lg font-semibold">{trackerData.username}</p>
            ) : (
              <p className="text-sm italic text-gray-500">Will be assigned after approval</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Application Date</h3>
            <p className="text-lg font-semibold">
              {new Date(trackerData.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Application Status</h3>
              {getStatusBadge(trackerData.status)}
            </div>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString("en-US")}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Admin Approval</h3>
              {trackerData.isApproved ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  Approved
                </span>
              ) : (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {trackerData.isApproved ? "Your application has been approved" : "Waiting for admin approval"}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Payment Status</h3>
              {getPaymentStatusBadge(trackerData.paymentStatus)}
            </div>
            <p className="text-sm text-gray-500">Amount: ₹{trackerData.amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Login Access Section */}
        {trackerData.isApproved && trackerData.paymentStatus === "Success" ? (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Your application is fully approved</h3>
                <p className="text-sm text-green-700">You can now access your account using your ID and password</p>
              </div>
              <a
                href="/login" // Adjust to your login route
                className="ml-auto rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
              >
                Login Now
              </a>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Login access pending</h3>
                <p className="text-sm text-yellow-700">
                  {!trackerData.isApproved
                    ? "Your application needs admin approval before you can login"
                    : "Complete your payment to access your account"}
                </p>
              </div>
              <div className="ml-auto flex items-center space-x-2 rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-1.5">
                <Lock className="h-4 w-4 text-yellow-700" />
                <span className="text-sm font-medium text-yellow-700">Locked</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-lg font-medium">Amount:</span>
            <span className="text-xl font-bold">₹{trackerData.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <h3 className="mb-6 text-2xl font-bold text-center text-gray-800">Application Progress</h3>
        <div className="relative space-y-8 mx-auto max-w-3xl">
          {trackerData.steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start sm:items-center space-x-4">
              {/* Timeline Icon */}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-gray-300 shadow-md">
                {getStatusIcon(step.status)}
              </div>
              {/* Vertical Connector */}
              {index < trackerData.steps.length - 1 && (
                <div className="absolute left-5 top-10 w-1 h-16 bg-gradient-to-b from-gray-300 to-gray-100"></div>
              )}
              {/* Step Details */}
              <div className="ml-6 w-full rounded-lg bg-gray-50 p-4 shadow-md hover:shadow-lg transition duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">{step.title}</h3>
                  {step.date && (
                    <p className="text-sm text-gray-500">
                      {new Date(step.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">{step.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormTracker;
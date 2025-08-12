









"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Filter, FileText, CheckCircle, XCircle, AlertCircle, Download, Calendar, Loader2, ToggleLeft, ToggleRight, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { getApplications, saveApplicationVerification, updateApplicationVerification, approveMembership } from "../Services/ApiServices/ApiService"
import ActionLoader from "./ActionLoader"
import { toast } from "react-hot-toast"
import 'react-toastify/dist/ReactToastify.css'

export default function ApplicationManagement() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [filterDate, setFilterDate] = useState("")
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [loaderType, setLoaderType] = useState("processing");
    const [loaderMessage, setLoaderMessage] = useState("Processing action...");
    const [remark, setRemark] = useState("")
    const token = sessionStorage.getItem('token')
    // const API_BASE_URL = process.env.REACT_APP_API_URL;
    const API_BASE_URL = import.meta.env.VITE_API_URL;


    // Fetch applications on component mount
    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true)
            try {
                const response = await getApplications(token)
                if (response.success === false) {
                    throw new Error(response.message || "Failed to fetch applications")
                }
                setCandidates(response)
                setError(null)
            } catch (err) {
                setError(err.message)
                // toast.error(`Error fetching applications: ${err.message}`)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchApplications()
        else toast.error("Please log in to view applications")
    }, [token])

    // Handle toggle for application steps
    const handleToggleStep = async (candidateId, step, currentStatus) => {
        const candidate = candidates.find(c => c.id === candidateId)
        if (!candidate) return

        // Convert camelCase step to snake_case
        const snakeCaseStep = step.replace(/([A-Z])/g, '_$1').toLowerCase()

        try {
            const verificationData = {
                user_id: candidate.user_id,
                [snakeCaseStep]: !currentStatus
            }
            const response = await updateApplicationVerification(verificationData, token)
            if (response.success !== false) {
                toast.success(`Updated ${step.replace(/([A-Z])/g, " $1").trim()} status`)
                // Refresh applications
                const updatedApplications = await getApplications(token)
                setCandidates(updatedApplications)
                setSelectedCandidate(updatedApplications.find(c => c.id === candidateId) || null)
            } else {
                throw new Error(response.message || "Failed to update verification status")
            }
        } catch (err) {
            toast.error(`Error updating step: ${err.message}`)
        }
    }

    const handleAction = async (candidateId, action) => {
  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  if (!remark && (action === "approve" || action === "reject")) {
    toast.error("Please provide a remark for this action");
    return;
  }

  setIsLoadingAction(true);
  setLoaderType("processing");
  setLoaderMessage("Processing application...");

  try {
    if (action === "approve" || action === "reject") {
      const data = {
        applicant_id: candidate.user_id,
        approved: action === "approve",
        remark: remark,
        type: "membership"
      };

      const response = await approveMembership(data, token);

      if (response.success) {
        // ✅ Success animation
        setLoaderType(action === "approve" ? "approve" : "reject");
        setLoaderMessage(response.message);
        await new Promise((res) => setTimeout(res, 1200)); // pause for effect

        toast.success(response.message);
        setRemark("");
        const updatedApplications = await getApplications(token);
        setCandidates(updatedApplications);
        setSelectedCandidate(null);
      } else {
        throw new Error(response.message || "Action failed");
      }
    }
  } catch (err) {
    toast.error(`Error performing action: ${err.message}`);
  } finally {
    setTimeout(() => setIsLoadingAction(false), 1000); // fade out loader
  }
};


    // Filter candidates based on search and filters
    const filteredCandidates = candidates.filter((candidate) => {
        const matchesSearch =
            candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.membership.plan.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "pending_payment" && candidate.applicationSteps.payment.status === "Pending") ||
            (statusFilter === "eligibility_pending" && candidate.eligibility.status === "Pending") ||
            (statusFilter === "complete" &&
                Object.values(candidate.applicationSteps).every((step) => step.completed))

        const matchesDate =
            !filterDate ||
            new Date(candidate.applicationSteps.personalDetails.timestamp).toDateString() ===
                new Date(filterDate).toDateString()

        return matchesSearch && matchesStatus && matchesDate
    })

    // Render candidate details page
    const renderCandidateDetails = (candidate) => (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{candidate.name} - Application #{candidate.id}</h2>
                <button
                    onClick={() => setSelectedCandidate(null)}
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                >
                    Back to List
                </button>
            </div>

            {/* Candidate Profile Overview */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Details</h3>
                    <p className="text-gray-600">Name: {candidate.name}</p>
                    <p className="text-gray-600">Email: {candidate.email}</p>
                    <p className="text-gray-600">Phone: {candidate.phone}</p>
                    <p className="text-gray-600">Address: {candidate.address}</p>
                    {candidate.gender && <p className="text-gray-600">Gender: {candidate.gender}</p>}
                    {candidate.date_of_birth && (
                        <p className="text-gray-600">
                            Date of Birth: {format(new Date(candidate.date_of_birth), "MMM d, yyyy")}
                        </p>
                    )}
                    {candidate.city && <p className="text-gray-600">City: {candidate.city}</p>}
                    {candidate.state && <p className="text-gray-600">State: {candidate.state}</p>}
                    {candidate.country && <p className="text-gray-600">Country: {candidate.country}</p>}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Academic Qualifications</h3>
                    {candidate.academic.length > 0 ? (
                        candidate.academic.map((qual, index) => (
                            <div key={index} className="text-gray-600 mb-2">
                                <p>{qual.degree}</p>
                                <p>{qual.institute}, {qual.year}</p>
                                <p>Branch: {qual.branch}</p>
                                {qual.percentage_cgpa && <p>Percentage/CGPA: {qual.percentage_cgpa}</p>}
                                {qual.document && (
                                    <a href={qual.document} className="text-blue-600 hover:underline" download>
                                        Download Document
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No qualifications provided</p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Experience</h3>
                    {candidate.experience.length > 0 ? (
                        candidate.experience.map((exp, index) => (
                            <div key={index} className="text-gray-600 mb-2">
                                <p>{exp.job_title} at {exp.organization_name}</p>
                                <p>{exp.work_type} ({exp.employee_type})</p>
                                <p>
                                    {format(new Date(exp.start_date), "MMM yyyy")} - 
                                    {exp.end_date ? format(new Date(exp.end_date), "MMM yyyy") : "Present"}
                                </p>
                                {exp.total_experience && <p>Total Experience: {exp.total_experience}</p>}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No experience provided</p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Proposers</h3>
                    {candidate.proposers.length > 0 ? (
                        candidate.proposers.map((proposer, index) => (
                            <div key={index} className="text-gray-600 mb-2">
                                <p>Name: {proposer.name}</p>
                                <p>Email: {proposer.email}</p>
                                <p>Mobile: {proposer.mobile_no}</p>
                                <p>Membership No: {proposer.membership_no}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">No proposers provided</p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Membership Details</h3>
                    <p className="text-gray-600">Plan: {candidate.membership.plan}</p>
                    <p className="text-gray-600">
                        Start Date: {format(new Date(candidate.membership.startDate), "MMM d, yyyy")}
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Uploads</h3>
                    {candidate.documents.length > 0 ? (
                        candidate.documents.map((doc, index) => (
                            doc.url && (
                                <div key={index} className="flex items-center gap-2 text-gray-600">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <a
                                        // href={`${'http://127.0.0.1:8000/api/v1/'}${doc.url}`}
                                        href={`${API_BASE_URL}${doc.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline cursor-pointer"
                                        title="Preview document"
                                    >
                                        {doc.name}
                                    </a>
                                    <span className="text-sm text-gray-500">
                                        Uploaded: {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy") : "N/A"}
                                    </span>
                                </div>
                            )
                        ))
                    ) : (
                        <p className="text-gray-600">No documents uploaded</p>
                    )}
                </div>

                {/* <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Eligibility Information</h3>
                    <p className="text-gray-600">Status: {candidate.eligibility.status}</p>
                    <p className="text-gray-600">Notes: {candidate.eligibility.notes || "None"}</p>
                </div> */}

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Application Process Tracking</h3>
                    <div className="space-y-2">
                        {Object.entries(candidate.applicationSteps).map(([step, data], index) => (
                            <div key={step} className="flex items-center gap-3">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        data.completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                                >
                                    {data.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-600 capitalize">
                                        {step.replace(/([A-Z])/g, " $1").trim()}
                                    </p>
                                    {data.timestamp && (
                                        <p className="text-sm text-gray-500">
                                            Completed: {format(new Date(data.timestamp), "MMM d, yyyy h:mm a")}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleToggleStep(candidate.id, step, data.completed)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                                >
                                    {data.completed ? (
                                        <ToggleRight className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span>{data.completed ? "Approved" : "Approve Manually"}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Status</h3>
                    <p className="text-gray-600">Status: {candidate.applicationSteps.payment.status}</p>
                    {candidate.applicationSteps.payment.transactionId && (
                        <p className="text-gray-600">
                            Transaction ID: {candidate.applicationSteps.payment.transactionId}
                        </p>
                    )}
                    {candidate.payment.amount && (
                        <p className="text-gray-600">Amount: {candidate.payment.amount}</p>
                    )}
                    {candidate.payment.method && (
                        <p className="text-gray-600">Method: {candidate.payment.method}</p>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Remark</h3>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter remarks for approval or rejection"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleAction(candidate.id, "approve")}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            disabled={candidate.eligibility.status !== "Pending"}
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleAction(candidate.id, "reject")}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                            disabled={candidate.eligibility.status !== "Pending"}
                        >
                            Reject
                        </button>
                        {/* <button
                            onClick={() => handleAction(candidate.id, "request_info")}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            Request Info
                        </button> */}
                        {/* <button
                            onClick={() => handleAction(candidate.id, "flag")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Flag for Review
                        </button> */}
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
         {isLoadingAction && (
      <ActionLoader
        isLoading={isLoadingAction}
        actionType={loaderType}
        message={loaderMessage}
      />
    )}
    
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Application Management</h1>

            {/* Search and Filtering Options */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, membership, or ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div className="flex-1">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="eligibility_pending">Eligibility Pending</option>
                            <option value="complete">Complete</option>
                        </select>
                    </div>

                    <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Select application date"
                        />
                    </div>
                </div>
            </div>

            {/* Candidate List or Details */}
            {selectedCandidate ? (
                renderCandidateDetails(selectedCandidate)
            ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Candidates</h2>
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <p className="text-red-600">Error: {error}</p>
                    ) : filteredCandidates.length === 0 ? (
                        <p className="text-gray-600">No candidates match the current filters.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Application ID</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Membership</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.map((candidate) => (
                                        <tr key={candidate.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{candidate.id}</td>
                                            <td className="py-3 px-4">{candidate.name}</td>
                                            <td className="py-3 px-4">{candidate.email}</td>
                                            <td className="py-3 px-4">{candidate.membership.plan}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm ${
                                                        candidate.eligibility.status === "Approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : candidate.eligibility.status === "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {candidate.eligibility.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => setSelectedCandidate(candidate)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    )
}



















































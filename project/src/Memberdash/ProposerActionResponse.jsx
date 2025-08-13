import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { actOnProposer } from "../Services/ApiServices/ApiService"; 
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function ProposerActionResponse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [proposer, setProposer] = useState("");
  const [applicant, setApplicant] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const res = await actOnProposer(token, action);
        setStatus(res.status);
        setMessage(res.message);
        setProposer(res.proposer);
        setApplicant(res.applicant);
        setError(false);
      } catch (err) {
  setError(true);

  const backendMessage = err?.response?.data?.detail;
  const status = err?.response?.status;

  if (backendMessage) {
    setMessage(backendMessage);
  } else if (status === 404) {
    setMessage("This token was not found.");
  } else {
    setMessage("Something went wrong. Please try again.");
  }
}
 finally {
        setLoading(false);
      }
    };

    if (token && action) {
      fetchResponse();
    } else {
      setError(true);
      setMessage("Missing or invalid token/action.");
      setLoading(false);
    }
  }, [token, action]);

  const renderIcon = () => {
    if (loading) return <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />;
    if (error) return <AlertCircle className="h-10 w-10 text-red-500" />;
    if (status === "approved") return <CheckCircle className="h-10 w-10 text-green-600" />;
    if (status === "rejected") return <XCircle className="h-10 w-10 text-red-600" />;
    if (status === "expired") return <ShieldCheck className="h-10 w-10 text-gray-500" />;
    return <AlertCircle className="h-10 w-10 text-yellow-600" />;
  };

  const renderTitle = () => {
    if (error) return "Message";
    if (status === "approved") return "Proposer Approved";
    if (status === "rejected") return "Proposer Rejected";
    if (status === "expired") return "Link Expired";
    return "Membership Response";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center border border-gray-100">
        <div className="flex flex-col items-center gap-4">
          {renderIcon()}
          <h2 className="text-2xl font-semibold text-gray-800">{renderTitle()}</h2>
          <p className="text-gray-600 text-sm">{message}</p>
          {!error && proposer && applicant && (
            <div className="mt-4 text-sm text-gray-500">
              <p><strong>Proposer:</strong> {proposer}</p>
              <p><strong>Applicant:</strong> {applicant}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

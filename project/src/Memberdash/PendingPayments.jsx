
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, FileText, Mail, AlertCircle, Download, DownloadIcon } from 'lucide-react';
import { getPendingPayments, verifyPendingPayments, generatePaymentReceipts } from '../Services/ApiServices/ApiService';

const PendingPayments = ({ token }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [receiptResults, setReceiptResults] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);

  // Fetch pending payments on mount
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await getPendingPayments(token);
        setPayments(response.payments || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch pending payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [token]);

  // Handle payment selection
  const handleSelectPayment = (paymentId) => {
    setSelectedPayments((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  // Handle verify payments
  const handleVerifyPayments = async () => {
    if (!selectedPayments.length) {
      setError('Please select at least one payment to verify');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyPendingPayments(selectedPayments, token);
      setPayments(payments.filter((p) => !response.verified.includes(p.id)));
      setSelectedPayments([]);
      setError(null);
      // alert(`Verified: ${response.verified.length}, Failed: ${response.failed.length}`);
    } catch (err) {
      setError('Failed to verify payments');
    } finally {
      setLoading(false);
    }
  };

  // Handle generate receipts
  const handleGenerateReceipts = async () => {
    if (!selectedPayments.length) {
      setError('Please select at least one payment to generate receipts');
      return;
    }
    setLoading(true);
    try {
      const response = await generatePaymentReceipts({ payment_ids: selectedPayments, send_email: sendEmail }, token);
      setReceiptResults(response);
      setPayments(payments.filter((p) => !response.receipts.some((r) => r.payment_id === p.id)));
      setSelectedPayments([]);
      setError(null);
    } catch (err) {
      setError('Failed to generate receipts');
    } finally {
      setLoading(false);
    }
  };

  // Handle receipt download
  const handleDownloadReceipt = (paymentId, receiptHtml) => {
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${paymentId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-gray-100 min-h-screen">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-8 flex items-center tracking-tight">
        <FileText className="mr-2 sm:mr-3 h-6 sm:h-8 w-6 sm:w-8 text-blue-600" /> Payments Management
      </h1>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-800 rounded-xl flex items-center shadow-md text-sm sm:text-base">
          <AlertCircle className="mr-2 sm:mr-3 h-5 sm:h-6 w-5 sm:w-6 text-red-600" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center my-8 sm:my-12">
          <Loader2 className="animate-spin h-8 sm:h-10 w-8 sm:w-10 text-blue-600" />
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <input
              type="checkbox"
              checked={selectedPayments.length === payments.length && payments.length > 0}
              onChange={() =>
                setSelectedPayments(
                  selectedPayments.length === payments.length ? [] : payments.map((p) => p.id)
                )
              }
              className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-base sm:text-lg font-medium">Select All ({selectedPayments.length} selected)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-4 gap-2 sm:gap-0">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mr-2 h-4 sm:h-5 w-4 sm:w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <Mail className="mr-1 h-4 sm:h-5 w-4 sm:w-5" /> <span className="text-sm sm:text-base">Send Email</span>
            </label>
            <button
              onClick={handleVerifyPayments}
              disabled={loading || !selectedPayments.length}
              className="px-3 sm:px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center transition-colors duration-200 shadow-md text-sm sm:text-base"
            >
              <CheckCircle className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Verify Payment
            </button>
            <button
              onClick={handleGenerateReceipts}
              disabled={loading || !selectedPayments.length}
              className="px-3 sm:px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 flex items-center transition-colors duration-200 shadow-md text-sm sm:text-base"
            >
              <DownloadIcon className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Generate Receipts
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base"></th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">ID</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">User Email</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">Amount</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">Status</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">Membership</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">Order ID</th>
                <th className="p-3 sm:p-4 font-semibold text-sm sm:text-base">Created At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-blue-50 transition-colors duration-150">
                  <td className="p-3 sm:p-4">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{payment.id}</td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{payment.user}</td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{payment.amount.toFixed(2)}</td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{payment.membership_type || 'N/A'}</td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{payment.order_id}</td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base">{new Date(payment.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {receiptResults && (
        <div className="mt-6 sm:mt-8 bg-white shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <FileText className="mr-2 h-5 sm:h-6 w-5 sm:w-6 text-blue-600" /> Receipt Generation Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 sm:mb-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-600">Total Requested</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-700">{receiptResults.total_requested}</p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-600">Verified & Receipts Generated</p>
              <p className="text-lg sm:text-2xl font-bold text-green-700">{receiptResults.verified_and_receipt_generated}</p>
            </div>
            <div className="bg-red-50 p-3 sm:p-4 rounded-lg text-center">
              <p className="text-xs sm:text-sm text-gray-600">Failed</p>
              <p className="text-lg sm:text-2xl font-bold text-red-700">{receiptResults.failed}</p>
            </div>
          </div>
          {receiptResults.receipts.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-4">Generated Receipts</h3>
              <div className="grid gap-4">
                {receiptResults.receipts.map((receipt) => (
                  <div key={receipt.payment_id} className="p-3 sm:p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Payment ID: {receipt.payment_id}</p>
                      <p className="text-xs sm:text-sm text-gray-600">User: {receipt.user_email}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadReceipt(receipt.payment_id, receipt.receipt_html)}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors duration-200 text-sm sm:text-base mt-2 sm:mt-0"
                    >
                      <Download className="mr-2 h-4 sm:h-5 w-4 sm:w-5" /> Download Receipt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {receiptResults.failures.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-medium text-red-600 mb-4">Failures</h3>
              <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base">
                {receiptResults.failures.map((failure) => (
                  <li key={failure.payment_id} className="text-red-600 mb-2">
                    Payment ID: {failure.payment_id} - {failure.reason}
                    {failure.error && <span> ({failure.error})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingPayments;
"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentHistory,
  setCurrentPage,
} from "../Redux/ReduxSlice/paymentSlice";
import {
  Download,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Shield,
  Mail,
} from "lucide-react";
import { jsPDF } from "jspdf";
// Import autoTable directly
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";

// Helper function to safely get ID substring
const getIdSubstring = (id, start = 0, end = 8) => {
  return String(id).substring(start, end);
};

const PaymentHistory = ({ token }) => {
  const dispatch = useDispatch();
  const { payments, count, next, previous, currentPage, loading, error } =
    useSelector((state) => state.payment);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch payment history
  useEffect(() => {
    dispatch(fetchPaymentHistory({ token, page: currentPage }));
  }, [dispatch, token, currentPage]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format amount with currency
  const formatAmount = (amount, currency) => {
    const number = Number.parseFloat(amount).toFixed(2);
    return currency === "INR" ? `₹${number}` : `$${number}`;
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(count / 5)) {
      dispatch(setCurrentPage(page));
    }
  };

  // Generate and download PDF receipt
  const downloadReceipt = async (payment) => {
    try {
      setGeneratingPdf(true);

      // Create new PDF document with better default settings
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Set document properties
      doc.setProperties({
        title: `Payment Receipt - ${payment.order_id}`,
        subject: "Payment Receipt",
        author: "IETE",
        creator: "Payment System",
      });

      // Document dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Add elegant header with gradient
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, pageWidth, 50, "F");

      // Add subtle gradient overlay
      for (let i = 0; i < 50; i++) {
        const alpha = 0.01 - (i / 50) * 0.01;
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: alpha }));
        doc.rect(0, i, pageWidth, 1, "F");
      }

      // Reset opacity
      doc.setGState(new doc.GState({ opacity: 1 }));

      // Add white text for header
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("PAYMENT RECEIPT", pageWidth / 2, 25, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("IETE", pageWidth / 2, 35, { align: "center" });

      // Reset text color for body
      doc.setTextColor(0, 0, 0);

      // Add receipt details section
      let yPos = 60;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Receipt Details", margin, yPos);

      // Add decorative line
      doc.setDrawColor(37, 99, 235); // Blue-600
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

      // Payment details
      yPos += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const paymentDetails = [
        ["Receipt ID:", `#${payment.receipt}`],
        ["Order ID:", payment.order_id],
        ["Date:", formatDate(payment.created_at)],
        ["Membership Type:", payment.membership_type],
        ["Status:", payment.status],
      ];

      paymentDetails.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 60, yPos);
        yPos += 10;
      });

      // Payment amount section with highlight
      yPos += 10;
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, "FD");

      doc.setTextColor(37, 99, 235); // Blue text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Total Amount Paid", pageWidth / 2, yPos + 12, {
        align: "center",
      });

      doc.setFontSize(20);
      doc.text(
        formatAmount(payment.amount, payment.currency),
        pageWidth / 2,
        yPos + 22,
        { align: "center" }
      );

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Add payment information table
      yPos += 45;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Payment Information", margin, yPos);

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

      // Create a table for payment details
      const paymentInfo = [
        ["Currency", payment.currency],
        ["Payment Method", "Online Payment"],
        ["Transaction ID", `TXN-${getIdSubstring(payment.payment_id, 0, 20)}`],
        ["Payment Gateway", "Secure Payment"],
      ];

      // Use autoTable correctly - call it directly, not as a method of doc
      autoTable(doc, {
        startY: yPos + 10,
        head: [["Detail", "Information"]],
        body: paymentInfo,
        theme: "striped",
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 12,
        },
        styles: {
          cellPadding: 6,
          fontSize: 11,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60 },
          1: { cellWidth: 110 },
        },
        margin: { left: margin, right: margin },
      });

      // Calculate the final Y position manually after the table
      // Each row is approximately 12mm high, plus header and padding
      const tableHeight = (paymentInfo.length + 1) * 12 + 10; // +1 for header, +10 for padding
      const finalY = yPos + 10 + tableHeight + 20;

      // Add terms and conditions
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions:", margin, finalY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const terms = [
        "• This receipt serves as proof of payment for the selected membership.",
        "• No refunds will be processed after the membership is activated.",
        "• For support inquiries, please contact our customer service team.",
        "• Keep this receipt for your records and future reference.",
      ];

      let termsY = finalY + 8;
      terms.forEach((term) => {
        doc.text(term, margin, termsY);
        termsY += 6;
      });

      // Add footer
      // Footer background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 40, pageWidth, 40, "F");

      // Thank you message
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("Thank You for Your Payment!", pageWidth / 2, pageHeight - 25, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        "This is an automatically generated receipt.",
        pageWidth / 2,
        pageHeight - 18,
        { align: "center" }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 12,
        { align: "center" }
      );

      // Add QR code placeholder
      // doc.setDrawColor(200, 200, 200)
      // doc.setFillColor(255, 255, 255)
      // doc.roundedRect(pageWidth - margin - 25, pageHeight - 65, 25, 25, 2, 2, "FD")
      // doc.setFontSize(8)
      // doc.setTextColor(150, 150, 150)
      // doc.text("QR Code", pageWidth - margin - 12.5, pageHeight - 52, { align: "center" })

      // Add watermark
      // doc.setTextColor(240, 240, 240)
      // doc.setFont("helvetica", "bold")
      // doc.setFontSize(50)
      // doc.text("PAID", pageWidth / 2, 160, {
      //   align: "center",
      //   angle: -45,
      //   renderingMode: "stroke",
      //   lineWidth: 0.5,
      // })

      // Add company logo placeholder
      // doc.setDrawColor(200, 200, 200)
      // doc.setFillColor(255, 255, 255)
      // doc.roundedRect(margin, pageHeight - 65, 25, 25, 2, 2, "FD")
      // doc.setFontSize(8)
      // doc.setTextColor(150, 150, 150)
      // doc.text("LOGO", margin + 12.5, pageHeight - 52, { align: "center" })

      // Save the PDF
      const filename = `Receipt-${payment.order_id}-${getIdSubstring(
        payment.id,
        0,
        6
      )}.pdf`;
      doc.save(filename);

      toast.success("Receipt downloaded successfully!");
      setGeneratingPdf(false);
    } catch (error) {
      toast.error("Error generating receipt. Please try again.");
      setGeneratingPdf(false);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status.toLowerCase()) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotColor: "bg-emerald-500",
        };
      case "pending":
        return {
          icon: <Clock className="w-4 h-4" />,
          className: "bg-amber-50 text-amber-700 border-amber-200",
          dotColor: "bg-amber-500",
        };
      case "failed":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          className: "bg-red-50 text-red-700 border-red-200",
          dotColor: "bg-red-500",
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          className: "bg-gray-50 text-gray-700 border-gray-200",
          dotColor: "bg-gray-500",
        };
    }
  };

  const totalPages = Math.ceil(count / 5) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Payment History
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage your payment transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Payments</span>
              </div>
              <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email Receipts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Payments
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {count || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">All your payment records</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Page
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {currentPage}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Viewing page {currentPage} of {totalPages}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalPages}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Browse through all pages</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">
                Loading payment history...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-semibold">
                Error loading payments
              </p>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!payments || payments.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
            <div className="text-center">
              <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No payments found
              </h3>
              <p className="text-gray-600">
                You haven't made any payments yet.
              </p>
            </div>
          </div>
        )}

        {/* Payment Table */}
        {!loading && !error && payments && payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => {
                    const statusDisplay = getStatusDisplay(payment.status);
                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-bold text-gray-900">
                              #{payment.id}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              Order ID: {payment.order_id}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(payment.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {payment.membership_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900">
                              {formatAmount(payment.amount, payment.currency)}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {payment.currency}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border ${statusDisplay.className}`}
                          >
                            {statusDisplay.icon}
                            {payment.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => downloadReceipt(payment)}
                            disabled={generatingPdf}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:hover:scale-100"
                          >
                            {generatingPdf ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Receipt
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {payments.map((payment) => {
                const statusDisplay = getStatusDisplay(payment.status);
                return (
                  <div
                    key={payment.id}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          #{payment.id}
                        </div>
                        <div className="text-xs text-gray-600">
                          Order: {payment.order_id}
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusDisplay.className}`}
                      >
                        {statusDisplay.icon}
                        {payment.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 font-medium">
                          Membership:
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {payment.membership_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 font-medium">
                          Amount:
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 font-medium">
                          Date:
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadReceipt(payment)}
                      disabled={generatingPdf}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
                    >
                      {generatingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Receipt...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Receipt
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    Showing page{" "}
                    <span className="font-bold text-blue-600">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-blue-600">
                      {totalPages}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!previous}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm ${
                            pageNum === currentPage
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!next}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;










import React, { useState, useEffect } from 'react';
import { Download, FileText, Table, FileSpreadsheet, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Included via CDN in index.html
import { exportMemberReport } from '../Services/ApiServices/ApiService'; // Adjust path to your apiService.js

const MemberReportExport = () => {
  const [format, setFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Hypothetical list of valid fields (replace with API call if available)
  const validFields = [
    'id', 'email', 'name', 'middle_name', 'last_name', 'membership_id',
    'title', 'mobile_number', 'date_of_birth', 'gender', 'address1',
    'address2', 'address3', 'highest_qualification', 'pincode',
    'father_name', 'mother_name', 'spouse_name', 'from_india', 'country',
    'state', 'city', 'remarks', 'eligibility', 'exposure',
    'electronics_experience', 'area_of_specialization', 'role'
  ];

  // Handle field selection
  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle form submission
  const handleExport = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    const token = sessionStorage.getItem('token'); // Adjust based on your auth setup
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setIsLoading(false);
      return;
    }

    // Validate fields client-side
    if (selectedFields.length > 0 && selectedFields.some((field) => !validFields.includes(field))) {
      setError('Invalid fields selected.');
      setIsLoading(false);
      return;
    }

    // Validate dates
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.');
      setIsLoading(false);
      return;
    }

    console.log("Exporting with fields:", selectedFields, "name:", nameFilter, "start_date:", formatDate(startDate), "end_date:", formatDate(endDate)); // Debugging
    const response = await exportMemberReport(
      format,
      selectedFields,
      nameFilter || null,
      formatDate(startDate) || null,
      formatDate(endDate) || null,
      token
    );
    setIsLoading(false);

    if (response.success) {
      setMessage(response.message);
    } else {
      setError(response.message || 'Failed to export report. Check console for details.');
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Download className="h-6 w-6 text-blue-600" />
          Export Member Reports
        </h1>

        <form onSubmit={handleExport} className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-4">
              {[
                { value: 'csv', label: 'CSV', icon: <Table className="h-5 w-5" /> },
                { value: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="h-5 w-5" /> },
                { value: 'pdf', label: 'PDF', icon: <FileText className="h-5 w-5" /> },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormat(option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                    format === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name Filter */}
          <div>
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Name Filter (Optional)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="nameFilter"
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Enter name to filter..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <DatePicker
                id="startDate"
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                maxDate={endDate || new Date()}
                showYearDropdown
                scrollableYearDropdown
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <DatePicker
                id="endDate"
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                minDate={startDate}
                maxDate={new Date()}
                showYearDropdown
                scrollableYearDropdown
              />
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fields (Optional)
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {validFields.map((field) => (
                  <label key={field} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => handleFieldToggle(field)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{field.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export Report
              </>
            )}
          </button>
        </form>

        {/* Success/Error Messages */}
        {message && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberReportExport;
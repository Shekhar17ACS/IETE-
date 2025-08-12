





import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAdminLogs } from '../Services/ApiServices/ApiService';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Info, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { debounce } from 'lodash';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logsPerPage, setLogsPerPage] = useState(5);
  const modalRef = useRef(null);
  const firstFocusableElementRef = useRef(null);

  // Debounced search
  const debouncedSetSearchTerm = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);

  // Memoized action color
  const getActionColor = useMemo(() => {
    return (action) => {
      switch (action?.toLowerCase()) {
        case 'create': return 'bg-green-100 text-green-800';
        case 'update': return 'bg-blue-100 text-blue-800';
        case 'delete': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
  }, []);

  // Memoized timestamp formatter
  const formatTimestamp = useMemo(() => {
    return (timestamp) => {
      try {
        return format(new Date(timestamp), 'dd MMM yyyy, hh:mm:ss a');
      } catch {
        return 'Invalid Date';
      }
    };
  }, []);

  // Fetch logs with lazy loading
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: logsPerPage,
          search: searchTerm || undefined,
          action: actionFilter || undefined,
          model: modelFilter || undefined,
          start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        };
        console.log('API Params:', params); // Debug
        const response = await getAdminLogs(params);
        console.log('API Response:', response); // Debug
        if (!response.results || !Array.isArray(response.results)) {
          throw new Error('Invalid response format');
        }
        setLogs(response.results);
        setTotalCount(response.count || 0);
      } catch (err) {
        console.error('Fetch Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [currentPage, logsPerPage, searchTerm, actionFilter, modelFilter, startDate, endDate]);

  // Sorting function
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Client-side sorting (fallback)
  const filteredAndSortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc'
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      }
      const aValue =
        sortConfig.key === 'changes.summary'
          ? a.changes?.summary?.toLowerCase() || ''
          : a[sortConfig.key]?.toString().toLowerCase() || '';
      const bValue =
        sortConfig.key === 'changes.summary'
          ? b.changes?.summary?.toLowerCase() || ''
          : b[sortConfig.key]?.toString().toLowerCase() || '';
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [logs, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(totalCount / logsPerPage);
  const paginatedLogs = filteredAndSortedLogs;

  // Export logs to CSV
  const exportToCSV = () => {
    const csv = [
      ['ID', 'Action', 'Model', 'Summary', 'IP Address', 'Timestamp', 'User'],
      ...logs.map((log) => [
        log.id,
        log.action,
        log.model_name,
        `"${log.changes?.summary || ''}"`,
        log.ip_address,
        formatTimestamp(log.timestamp),
        log.changes?.user?.email || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setModelFilter('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  // Focus management for modal
  useEffect(() => {
    if (selectedLog && modalRef.current) {
      modalRef.current.focus();
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        firstFocusableElementRef.current = focusableElements[0];
        firstFocusableElementRef.current.focus();
      }
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedLog(null);
        }
        if (e.key === 'Tab') {
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedLog]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="space-y-4">
          {[...Array(logsPerPage)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen text-red-600 text-center">
        Error: {error}
        <button
          onClick={() => {
            setError(null);
            setCurrentPage(1);
          }}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!paginatedLogs.length && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="text-center py-8 text-gray-500">
          No logs found matching your criteria.
          {(searchTerm || actionFilter || modelFilter || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="ml-2 text-indigo-600 hover:text-indigo-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Header and Filters */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search logs..."
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search logs"
            />
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-8 py-2 border rounded-lg w-full md:w-auto"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="px-8 py-2 border rounded-lg w-full md:w-auto mt-2 md:mt-0"
            aria-label="Filter by model"
          >
            <option value="">All Models</option>
            <option value="Role">Role</option>
            <option value="Group">Group</option>
          </select>
          <div className="relative w-full md:w-auto mt-2 md:mt-0">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              className="px-4 py-2 border rounded-lg w-full"
              placeholderText="Select date range"
              aria-label="Filter by date range"
            />
            <Calendar className="h-5 w-5 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg mt-2 md:mt-0 w-full md:w-auto"
            aria-label="Export logs to CSV"
          >
            Export CSV
          </button>
          {(searchTerm || actionFilter || modelFilter || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-900 mt-2 md:mt-0"
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="grid" aria-label="Audit logs table">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Action', 'Model', 'Summary', 'IP Address', 'Timestamp', 'Details'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer md:table-cell"
                    onClick={() =>
                      header !== 'Details' &&
                      handleSort(
                        header === 'ID' ? 'id' :
                        header === 'Action' ? 'action' :
                        header === 'Model' ? 'model_name' :
                        header === 'Summary' ? 'changes.summary' :
                        header === 'IP Address' ? 'ip_address' :
                        'timestamp'
                      )
                    }
                    aria-sort={
                      sortConfig.key ===
                        (header === 'ID' ? 'id' :
                         header === 'Action' ? 'action' :
                         header === 'Model' ? 'model_name' :
                         header === 'Summary' ? 'changes.summary' :
                         header === 'IP Address' ? 'ip_address' :
                         'timestamp') &&
                      sortConfig.direction === 'asc'
                        ? 'ascending'
                        : sortConfig.direction === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    <div className="flex items-center" role="button" aria-label={`Sort by ${header}`}>
                      {header}
                      {sortConfig.key ===
                        (header === 'ID' ? 'id' :
                         header === 'Action' ? 'action' :
                         header === 'Model' ? 'model_name' :
                         header === 'Summary' ? 'changes.summary' :
                         header === 'IP Address' ? 'ip_address' :
                         'timestamp') && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 md:divide-y-0">
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 md:table-row block mb-4 md:mb-0"
                  role="row"
                >
                  <td className="px-6 py-4 text-sm text-gray-500 block md:table-cell">
                    <span className="md:hidden font-medium">ID:</span> {log.id}
                  </td>
                  <td className="px-6 py-4 block md:table-cell">
                    <span className="md:hidden font-medium">Action:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action?.charAt(0).toUpperCase() + (log.action?.slice(1) || '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 block md:table-cell">
                    <span className="md:hidden font-medium">Model:</span> {log.model_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate block md:table-cell">
                    <span className="md:hidden font-medium">Summary:</span> {log.changes?.summary}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 block md:table-cell">
                    <span className="md:hidden font-medium">IP Address:</span> {log.ip_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 block md:table-cell">
                    <span className="md:hidden font-medium">Timestamp:</span> {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm block md:table-cell">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label={`View details for log ${log.id}`}
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-700 mb-2 md:mb-0">
            Showing {(currentPage - 1) * logsPerPage + 1} to{' '}
            {Math.min(currentPage * logsPerPage, totalCount)} of {totalCount} logs
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
            <select
              value={logsPerPage}
              onChange={(e) => {
                setLogsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-5 py-1 border rounded"
              aria-label="Select logs per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                if (page <= totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300'
                      }`}
                      aria-label={`Go to page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Log Details */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4"
            ref={modalRef}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="log-details-title"
          >
            <div className="p-6">
              <h2 id="log-details-title" className="text-xl font-bold text-gray-800 mb-4">
                Log Details
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">ID:</span> {selectedLog.id}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Action:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action?.charAt(0).toUpperCase() + (selectedLog.action?.slice(1) || '')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Model:</span> {selectedLog.model_name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Object ID:</span> {selectedLog.object_id}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Summary:</span> {selectedLog.changes?.summary}
                </div>
                <div>
                  <span className="font-medium text-gray-700">IP Address:</span> {selectedLog.ip_address}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Timestamp:</span> {formatTimestamp(selectedLog.timestamp)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">User:</span> {selectedLog.changes?.user?.email}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Changes:</span>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
              <button
                onClick={() => setSelectedLog(null)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedLog(null)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                aria-label="Close log details"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
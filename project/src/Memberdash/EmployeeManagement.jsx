import React, { useState, useEffect } from "react";
import { Trash, Pencil, Search, Mail } from "lucide-react";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  createBulkEmployees,
  updateEmployee,
  deleteEmployee,
  getRoleList,
} from "../Services/ApiServices/ApiService";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    address1: "",
  });
  const [updateEmployeeId, setUpdateEmployeeId] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const token = sessionStorage.getItem("token");

  // Fetch employees and roles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, roleRes] = await Promise.all([
          getEmployees(token),
          getRoleList(token),
        ]);

        if (employeeRes.success === false) throw new Error(employeeRes.message);
        if (!Array.isArray(employeeRes)) {
          throw new Error("Invalid employee data format");
        }

        if (roleRes.success === false) throw new Error(roleRes.message);

        setEmployees(employeeRes.filter((emp) => emp && emp.id && emp.email));
        setRoles(Array.isArray(roleRes.data) ? roleRes.data : roleRes);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      }
    };
    if (token) fetchData();
  }, [token]);

  // Filter employees with defensive checks
  const filteredEmployees = employees.filter((employee) => {
    if (!employee || !employee.email) return false;
    return (
      (employee.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle update employee
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        address1: formData.address1 || null,
      };
      const response = await updateEmployee(
        updateEmployeeId,
        updateData,
        token
      );

      if (response.success === false)
        throw new Error(response.message || "Failed to update employee");
      setEmployees(
        employees
          .map((emp) => (emp.id === updateEmployeeId ? response : emp))
          .filter((emp) => emp && emp.id)
      );
      setIsUpdateModalOpen(false);
      setFormData({
        name: "",
        email: "",
        role: "",
        address1: "",
      });
      setError("");
    } catch (err) {
      const errorMessage =
        err.message || err.response?.data?.error || "Failed to update employee";
      setError(errorMessage);
    }
  };

  // Handle delete employee
  const handleDelete = async () => {
    try {
      const response = await deleteEmployee(updateEmployeeId, token);
      if (response.success === false)
        throw new Error(response.message || "Failed to delete employee");
      setEmployees(employees.filter((emp) => emp.id !== updateEmployeeId));
      setIsDeleteModalOpen(false);
      setError("");
    } catch (err) {
      const errorMessage =
        err.message || err.response?.data?.error || "Failed to delete employee";
      setError(errorMessage);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const results = await Promise.all(
        selectedEmployees.map(async (id) => {
          try {
            const response = await deleteEmployee(id, token);
            return {
              id,
              success: response.success !== false,
              message: response.message,
            };
          } catch (err) {
            return {
              id,
              success: false,
              message: err.message || "Failed to delete",
            };
          }
        })
      );

      const failedDeletions = results.filter((result) => !result.success);
      if (failedDeletions.length > 0) {
        setError(
          failedDeletions
            .map((result) => `Employee ID ${result.id}: ${result.message}`)
            .join("; ")
        );
      } else {
        setError("");
      }

      setEmployees(
        employees.filter((emp) => !selectedEmployees.includes(emp.id))
      );
      setSelectedEmployees([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to delete employees");
    }
  };

  // Handle bulk create via file upload
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setError("Please select a CSV or XLSX file");
      return;
    }
    if (!bulkFile.name.match(/\.(csv|xlsx)$/i)) {
      setError("Only CSV or XLSX files are allowed");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const response = await createBulkEmployees(formData, token);

      if (response.success === false)
        throw new Error(response.message || "Failed to process bulk upload");

      const createdEmployees = Array.isArray(response) ? response : [];

      if (response.errors && response.errors.length > 0) {
        setError(
          response.errors
            .map(
              (err) =>
                `Row ${err.index + 1}: ${
                  err.message || JSON.stringify(err.errors)
                }`
            )
            .join("; ")
        );
      } else {
        setError("");
      }

      setEmployees(
        [...employees, ...createdEmployees].filter(
          (emp) => emp && emp.id && emp.email
        )
      );
      setBulkFile(null);
      document.getElementById("bulk-upload").value = "";
    } catch (err) {
      const errorMessage =
        err.message ||
        err.response?.data?.error ||
        "Failed to process bulk upload";
      setError(errorMessage);
    }
  };

  // Open update modal with employee data
  const openUpdateModal = async (id) => {
    try {
      const response = await getEmployee(id, token);

      if (response.success === false)
        throw new Error(response.message || "Failed to fetch employee");
      setFormData({
        name: response.name || "",
        email: response.email || "",
        role: response.role?.name || response.role || "",
        address1: response.address1 || "",
      });
      setUpdateEmployeeId(id);
      setIsUpdateModalOpen(true);
    } catch (err) {
      const errorMessage =
        err.message || err.response?.data?.error || "Failed to fetch employee";
      setError(errorMessage);
    }
  };

  // Handle checkbox selection
  const handleSelect = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  };

  // Select all employees
  const handleSelectAll = () => {
    if (
      selectedEmployees.length === filteredEmployees.length &&
      filteredEmployees.length > 0
    ) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg rounded-lg mb-6 p-6">
        <h1 className="text-3xl font-bold text-gray-800">Members Management</h1>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {(error || successMessage) && (
          <div
            className={`border-l-4 p-4 mb-6 rounded-r-lg ${
              error
                ? "bg-red-50 border-red-400"
                : "bg-green-50 border-green-400"
            }`}
          >
            <p className={error ? "text-red-700" : "text-green-700"}>
              {error || successMessage}
            </p>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {selectedEmployees.length > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Trash className="h-5 w-5 mr-2" /> Delete Selected
              </button>
            )}
          </div>
        </div>

        {/* Bulk Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bulk Upload (CSV or XLSX)
          </label>
          <input
            id="bulk-upload"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setBulkFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={handleBulkCreate}
            className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            disabled={!bulkFile}
          >
            Upload and Create
          </button>
        </div>

        {/* Employee Table */}
        <div className="shadow-lg bg-white rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedEmployees.length === filteredEmployees.length &&
                      filteredEmployees.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleSelect(employee.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.email || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.role?.name || employee.role || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.membership_id || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.address1 || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openUpdateModal(employee.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setUpdateEmployeeId(employee.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Member</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1 || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setFormData({
                      name: "",
                      email: "",
                      role: "",
                      address1: "",
                    });
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this employee?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setError("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Bulk Deletion</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete {selectedEmployees.length}{" "}
              Member(s)?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsBulkDeleteModalOpen(false);
                  setError("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

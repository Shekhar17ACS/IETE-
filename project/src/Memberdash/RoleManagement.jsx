
"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Search,
  Shield,
  Loader2,
  Save,
  Filter,
  ChevronDown,
  X,
  Plus,
  Edit,
  Trash,
  Users,
} from "lucide-react";
import { getRoles, createRole, updateRole, deleteRoles } from "../Services/ApiServices/ApiService";

const RoleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Roles");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [updateRoleData, setUpdateRoleData] = useState({ id: "", name: "" });
  const [rolesToDelete, setRolesToDelete] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);

  // Fetch roles without auto-creating system roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await getRoles(token);
      if (response.success === false) {
        setError(response.message || "Failed to fetch roles.");
        setRoles([]);
        setLoading(false);
        return;
      }

      const rolesData = Array.isArray(response) ? response : [];
      setRoles(rolesData);
      setLoading(false);
    };

    fetchRoles();
  }, []);

  // Filter roles based on search term and filter type
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create role
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaveStatus("saving");
    setError(null);
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      setSaveStatus(null);
      return;
    }

    const response = await createRole({ name: newRoleName }, token);
    if (response.success === false) {
      setError(response.message || "Failed to create role.");
      setSaveStatus(null);
    } else {
      setRoles((prev) => [...prev, response.data]);
      setNewRoleName("");
      setShowCreateModal(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Handle update role
  const handleUpdateRole = async () => {
    if (!updateRoleData.name.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaveStatus("saving");
    setError(null);
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      setSaveStatus(null);
      return;
    }

    const response = await updateRole(updateRoleData.id, { name: updateRoleData.name }, token);
    if (response.success === false) {
      setError(response.message || "Failed to update role.");
      setSaveStatus(null);
    } else {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === updateRoleData.id ? { ...role, ...response.data } : role
        )
      );
      setUpdateRoleData({ id: "", name: "" });
      setShowUpdateModal(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDeleteRoles = async () => {
  setSaveStatus("saving");
  setError(null);
  const token = sessionStorage.getItem("token");
  if (!token) {
    setError("No authentication token found. Please log in.");
    setSaveStatus(null);
    return;
  }

  const response = await deleteRoles(rolesToDelete, token);

  if (response.success === false) {
    const successfulDeletions = response.results.filter((r) => r.success).map((r) => r.id);
    const failedDeletions = response.results.filter((r) => !r.success);

    if (successfulDeletions.length > 0) {
      setRoles((prev) => prev.filter((role) => !successfulDeletions.includes(role.id)));
    }

    if (failedDeletions.length > 0) {
      setError(
        `Failed to delete ${failedDeletions.length} role(s): ${failedDeletions
          .map((r) => r.message || "Unknown error")
          .join(", ")}`
      );
      setSaveStatus(null);
    } else {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  } else {
    setRoles((prev) => prev.filter((role) => !rolesToDelete.includes(role.id)));
    setSaveStatus("success");
    setTimeout(() => setSaveStatus(null), 3000);
  }

  setRolesToDelete([]);
  setShowDeleteModal(false);
};

  // Toggle role selection for deletion
  const toggleRoleSelection = (roleId) => {
    setRolesToDelete((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="w-full shadow-lg bg-white rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role Management
            </h2>
            <p className="text-sm text-gray-500">
              Create, update, or delete roles in the system.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md text-white font-medium flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        </div>
      </div>
      <div className="p-0">
        <div className="p-4 border-b bg-gray-50">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-200">
            {/* {error} */}
            You do not have permission to access this page. Please contact your administrator.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Loading roles...</span>
          </div>
        ) : filteredRoles.length === 0 && !error ? (
          <div className="p-4 text-center text-gray-500">No roles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-medium text-gray-600 w-1/12">
                    <input
                      type="checkbox"
                      checked={rolesToDelete.length === filteredRoles.length && filteredRoles.length > 0}
                      onChange={() =>
                        setRolesToDelete(
                          rolesToDelete.length === filteredRoles.length
                            ? []
                            : filteredRoles.map((role) => role.id)
                        )
                      }
                      className="h-5 w-5 border border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 focus:outline-none cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-4 font-medium text-gray-600 w-3/12">ROLE NAME</th>
                  <th className="text-left p-4 font-medium text-gray-600 w-3/12">CREATED AT</th>
                  <th className="text-left p-4 font-medium text-gray-600 w-3/12">UPDATED AT</th>
                  <th className="text-center p-4 font-medium text-gray-600 w-2/12">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={rolesToDelete.includes(role.id)}
                        onChange={() => toggleRoleSelection(role.id)}
                        className="h-5 w-5 border border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 focus:outline-none cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-600" />
                        {role.name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {new Date(role.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {new Date(role.updated_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            setUpdateRoleData({ id: role.id, name: role.name }) &
                            setShowUpdateModal(true)
                          }
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Edit Role"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setRolesToDelete([role.id]) & setShowDeleteModal(true)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Delete Role"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Role</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                    saveStatus === "saving"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Role Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Update Role</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={updateRoleData.name}
                  onChange={(e) =>
                    setUpdateRoleData({ ...updateRoleData, name: e.target.value })
                  }
                  placeholder="Enter role name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                    saveStatus === "saving"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Role Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delete Role(s)</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {rolesToDelete.length} role(s)? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoles}
                  className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                    saveStatus === "saving"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
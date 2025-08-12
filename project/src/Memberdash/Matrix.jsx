

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
  Settings,
  User,
  Users,
  UserCheck,
  School,
  BookOpen,
  FileText,
  Lock,
  Eye,
  Edit,
  Trash,
  Plus,
  Bell,
} from "lucide-react";
import { getPermissionMatrix, togglePermission, bulkUpdatePermissions, getRoleList } from "../Services/ApiServices/ApiService";

const Matrix = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Role Based");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]); // Store { name, apiName, icon }
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Role icon mapping
  const roleIconMap = {
    Admin: <Settings size={16} />,
    Staff: <User size={16} />,
    GC: <Users size={16} />,
    "Secretary General": <UserCheck size={16} />,
    Members: <Users size={16} />,
    Accounts: <BookOpen size={16} />,
    Chairmen: <School size={16} />,
    "Super-Admin": <Shield size={16} />,
  };

  // Permission categories for rendering icons
  const permissionCategories = [
    { name: "logentry", icon: <FileText size={16} /> },
    { name: "Employee Administration", icon: <BookOpen size={16} /> },
    { name: "Accounts", icon: <School size={16} /> },
    { name: "Members", icon: <User size={16} /> },
    { name: "document", icon: <FileText size={16} /> },
    { name: "notification", icon: <Bell size={16} /> },
  ];

  // Normalize role names for UI and track API names
  const normalizeRoleName = (apiName) => {
    const nameMap = {
      "SEC-GEN": "Secretary General",
      MEMBERS: "Members",
      STAFF: "Staff",
      "Super-Admin": "Super-Admin",
      Admin: "Admin",
      GC: "GC",
    };
    return nameMap[apiName] || apiName;
  };

  // Fetch roles and permissions on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      // Fetch roles
      const roleResponse = await getRoleList(token);
      console.log("getRoleList response:", roleResponse);
      if (roleResponse.success === false) {
        setError(roleResponse.message || "Failed to fetch roles.");
        setRoles([]);
      } else {
        const rolesData = Array.isArray(roleResponse.data)
          ? roleResponse.data.map((role) => ({
              name: normalizeRoleName(role.name), // UI name
              apiName: role.name, // Raw API name
              icon: roleIconMap[normalizeRoleName(role.name)] || <User size={16} />,
            }))
          : [];
        setRoles(rolesData);
      }

      // Fetch permissions
      const permissionResponse = await getPermissionMatrix(token);
      console.log("getPermissionMatrix response:", permissionResponse);
      if (permissionResponse.success === false) {
        setError(permissionResponse.message || "Failed to fetch permissions.");
        setPermissions([]);
      } else {
        let permissionsData = [];
        if (Array.isArray(permissionResponse)) {
          permissionsData = permissionResponse;
        } else if (permissionResponse.data && Array.isArray(permissionResponse.data)) {
          permissionsData = permissionResponse.data;
        } else if (permissionResponse.results && Array.isArray(permissionResponse.results)) {
          permissionsData = permissionResponse.results;
        } else if (permissionResponse.permissions && Array.isArray(permissionResponse.permissions)) {
          permissionsData = permissionResponse.permissions;
        } else {
          setError("Unexpected response format from permissions API.");
        }

        permissionsData = permissionsData.filter(
          (perm) =>
            perm &&
            typeof perm === "object" &&
            perm.id &&
            perm.name &&
            perm.category &&
            perm.roles &&
            typeof perm.roles === "object"
        );
        setPermissions(permissionsData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter permissions with safeguard
  const filteredPermissions = Array.isArray(permissions)
    ? permissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permission.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  // Handle permission checkbox change
  const handlePermissionChange = async (permissionId, roleName, checked) => {
    // Find the role's API name
    const role = roles.find((r) => r.name === roleName);
    if (!role) return;

    setPermissions((prevPermissions) =>
      prevPermissions.map((permission) =>
        permission.id === permissionId
          ? { ...permission, roles: { ...permission.roles, [role.apiName]: checked } }
          : permission
      )
    );

    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      setPermissions((prevPermissions) =>
        prevPermissions.map((permission) =>
          permission.id === permissionId
            ? { ...permission, roles: { ...permission.roles, [role.apiName]: !checked } }
            : permission
        )
      );
      return;
    }

    const response = await togglePermission(
      { role: role.apiName, permission: permissionId, value: checked },
      token
    );

    if (response.success === false) {
      setError(response.message || "Failed to update permission.");
      setPermissions((prevPermissions) =>
        prevPermissions.map((permission) =>
          permission.id === permissionId
            ? { ...permission, roles: { ...permission.roles, [role.apiName]: !checked } }
            : permission
        )
      );
    }
  };

  // Handle saving all permissions
  const handleSavePermissions = async () => {
    setSaveStatus("saving");
    setError(null);
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      setSaveStatus(null);
      return;
    }

    const payloads = roles.map((role) => {
      const permissionsForRole = {};
      permissions.forEach((permission) => {
        permissionsForRole[permission.id] = permission.roles[role.apiName] || false;
      });
      return { role: role.apiName, permissions: permissionsForRole };
    });

    console.log("bulkUpdatePermissions payloads:", payloads); // Debug log

    try {
      for (const payload of payloads) {
        const response = await bulkUpdatePermissions(payload, token);
        if (response.success === false) {
          throw new Error(response.message || `Failed to update permissions for ${payload.role}`);
        }
      }
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save permissions.");
      setSaveStatus(null);
    }
  };

  const getPermissionIcon = (permissionName) => {
    if (permissionName.includes("add"))
      return <Plus size={14} className="text-green-600" />;
    if (permissionName.includes("change") || permissionName.includes("edit"))
      return <Edit size={14} className="text-blue-600" />;
    if (permissionName.includes("delete"))
      return <Trash size={14} className="text-red-600" />;
    if (permissionName.includes("view"))
      return <Eye size={14} className="text-purple-600" />;
    return <Lock size={14} className="text-gray-600" />;
  };

  return (
    <div className="w-full shadow-lg bg-white rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role & Permission Matrix
            </h2>
            <p className="text-sm text-gray-500">
              Manage permissions for different roles in the system.
            </p>
          </div>
          <button
            onClick={handleSavePermissions}
            className={`px-4 py-2 rounded-md text-white font-medium flex items-center justify-center gap-2 ${
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
            ) : saveStatus === "success" ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-0">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                placeholder="Search permissions..."
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
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full md:w-[180px] px-4 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <span>{filterType}</span>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              {showFilterDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                  {["Role Based", "Permission Based", "Module Based"].map(
                    (type) => (
                      <div
                        key={type}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                          filterType === type ? "bg-blue-50 text-blue-600" : ""
                        }`}
                        onClick={() => {
                          setFilterType(type);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {type}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">
              Loading permissions...
            </span>
          </div>
        ) : permissions.length === 0 && !error ? (
          <div className="p-4 text-center text-gray-500">
            No permissions found.
          </div>
        ) : roles.length === 0 && !error ? (
          <div className="p-4 text-center text-gray-500">
            No roles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-medium text-gray-600 w-1/4">
                    PERMISSION
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.name}
                      className="text-center p-4 font-medium text-gray-600"
                    >
                      <div className="group relative">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center gap-1">
                            {role.icon}
                            <span className="uppercase text-xs">
                              {role.name}
                            </span>
                          </div>
                          {role.name === "Admin" && (
                            <span className="mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              Super User
                            </span>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute z-10 p-2 bg-gray-800 text-white text-xs rounded whitespace-nowrap left-1/2 transform -translate-x-1/2 -bottom-8">
                          Manage {role.name} permissions
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(
                  ([category, categoryPermissions]) => (
                    <>
                      <tr key={`category-${category}`} className="bg-gray-50">
                        <td colSpan={roles.length + 1} className="p-2 px-4">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-medium rounded-md
                              ${
                                category === "Members"
                                  ? "bg-green-100 text-green-700"
                                  : category === "Accounts"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : category === "document"
                                  ? "bg-purple-100 text-purple-700"
                                  : category === "logentry"
                                  ? "bg-blue-100 text-blue-700"
                                  : category === "Employee Administration"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {
                                permissionCategories.find(
                                  (c) => c.name === category
                                )?.icon
                              }
                              <span className="ml-1">{category}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {categoryPermissions.length} permissions
                            </span>
                          </div>
                        </td>
                      </tr>
                      {categoryPermissions.map((permission) => (
                        <tr
                          key={permission.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              {getPermissionIcon(permission.name)}
                              <span>{permission.name}</span>
                            </div>
                          </td>
                          {roles.map((role) => (
                            <td
                              key={`${permission.id}-${role.name}`}
                              className="text-center p-2"
                            >
                              <div className="relative inline-block">
                                <input
                                  type="checkbox"
                                  checked={permission.roles[role.apiName] || false}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      permission.id,
                                      role.name,
                                      e.target.checked
                                    )
                                  }
                                  className="appearance-none h-5 w-5 border border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 cursor-pointer"
                                />
                                {permission.roles[role.apiName] && (
                                  <Check className="absolute top-0 left-0 h-5 w-5 text-white pointer-events-none" />
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matrix;
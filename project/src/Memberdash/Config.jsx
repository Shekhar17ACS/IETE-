



import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Edit, X, Users, Percent, Trash2 } from 'lucide-react';
import {
  getConfigSetting,
  saveConfigSetting,
  updateConfigSetting,
  deleteConfigSetting,
  getEmployees,
} from '../Services/ApiServices/ApiService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Config = ({ token }) => {
  const [configs, setConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    type: 'membership',
    title: '',
    approval_prsnt: 100,
    approval_user_ids: [],
    heirarchy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getConfigSetting({ type: 'membership' }, token);
      setConfigs(Array.isArray(response) ? response : [response].filter(Boolean));
    } catch (error) {
      toast.error('Failed to fetch config settings');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getEmployees(token);
      setUsers(response);
    } catch (error) {
      toast.error('Failed to load users');
    }
  }, [token]);

  useEffect(() => {
    fetchConfigs();
    fetchUsers();
  }, [fetchConfigs, fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'approval_prsnt' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleUserSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setFormData((prev) => ({
      ...prev,
      approval_user_ids: selected,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      if (isEditing && formData.id) {
        response = await updateConfigSetting(formData, token);
      } else {
        response = await saveConfigSetting(formData, token, formData.type);
      }

      if (response?.success) {
        toast.success(response.message || 'Config saved successfully');
        fetchConfigs();
        setIsModalOpen(false);
        setIsEditing(false);
      } else {
        toast.error(response?.message || 'Failed to save config');
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to save config settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (configId) => {
    setIsLoading(true);
    try {
      await deleteConfigSetting({ id: configId, type: 'membership' }, token);
      toast.success('Config deleted successfully');
      fetchConfigs();
    } catch (error) {

      toast.error(error?.response?.data?.detail || 'Failed to delete config');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (edit = false, config = null) => {
    setIsEditing(edit);
    if (edit && config) {
      setFormData({
        id: config.id,
        type: config.type,
        title: config.title || '',
        approval_prsnt: parseFloat(config.approval_prsnt) || 100,
        approval_user_ids: config.approval_user?.map((user) => user.id) || [],
        heirarchy: config.heirarchy || false,
      });
    } else {
      setFormData({
        id: '',
        type: 'membership',
        title: '',
        approval_prsnt: 100,
        approval_user_ids: [],
        heirarchy: false,
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuration Management</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal(false)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Create Config</span>
        </motion.button>
      </div>

      {isLoading && !configs.length ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="h-10 w-10 border-t-2 border-b-2 border-indigo-600 rounded-full"
          />
        </div>
      ) : configs.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((config) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => openModal(true, config)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Edit className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <Percent className="h-4 w-4" />
                    <span>Approval Percentage</span>
                  </p>
                  <p className="text-gray-800 font-medium">{config.approval_prsnt}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Approvers</span>
                  </p>
                  <p className="text-gray-800 font-medium">
                    {config.approval_user?.map((user) => user.name || user.email).join(', ') || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hierarchy</p>
                  <p className="text-gray-800 font-medium">{config.heirarchy ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center">No configurations found. Create a new one to get started.</p>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Configuration' : 'Create Configuration'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Configuration title"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Percent className="h-5 w-5 text-gray-500" />
                    <span>Approval Percentage</span>
                  </label>
                  <input
                    type="number"
                    name="approval_prsnt"
                    value={formData.approval_prsnt}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span>Select Approver Users</span>
                  </label>
                  <select
                    multiple
                    name="approval_user_ids"
                    value={formData.approval_user_ids}
                    onChange={handleUserSelectChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {/* {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))} */}
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} — {user.role || "N/A"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">Hold Ctrl/Cmd to select multiple users</p>
                </div>

                <div className="mb-6 flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="heirarchy"
                    checked={formData.heirarchy}
                    onChange={handleToggleChange}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Hierarchy</label>
                </div>

                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full"
                      />
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>{isEditing ? 'Update' : 'Create'}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Config;
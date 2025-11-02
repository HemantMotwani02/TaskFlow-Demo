import React, { useState, useEffect } from 'react';
import { useProjectStore, useUserStore } from '../../store';
import { useAuthStore } from '../../store';
import { 
  XMarkIcon,
  FolderIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const NewProjectForm = ({ onClose, onProjectCreated }) => {
  const { createProject } = useProjectStore();
  const { managers, fetchManagers, isLoading: managersLoading, error: managersError } = useUserStore();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  
  console.log('🔍 NewProjectForm render - managers:', managers);
  console.log('🔍 NewProjectForm render - managers.length:', managers?.length);
  console.log('🔍 NewProjectForm render - user:', user);
  console.log('🔍 NewProjectForm render - isAuthenticated:', isAuthenticated);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    priority: 'medium',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔍 NewProjectForm: useEffect triggered, fetching managers...');
    console.log('🔍 Current managers state:', managers);
    console.log('🔍 Authentication state:', { user, isAuthenticated });
    
    // Initialize authentication if not already done
    if (!isAuthenticated && !user) {
      console.log('🔍 Initializing authentication...');
      initializeAuth();
    }
    
    // Only fetch managers if user is authenticated
    if (isAuthenticated && user) {
      console.log('🔍 User is authenticated, fetching managers...');
      fetchManagers();
    } else {
      console.log('❌ User is not authenticated, cannot fetch managers');
    }
  }, [fetchManagers, isAuthenticated, user, initializeAuth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.managerId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        managerId: parseInt(formData.managerId),
        priority: formData.priority,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      const result = await createProject(projectData);
      
      if (result.success) {
        // Callback with the created project data
        onProjectCreated && onProjectCreated(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('An error occurred while creating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'urgent': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FolderIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Basic Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Provide the essential details for your project</p>
              </div>

              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                />
              </div>

              {/* Project Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Describe the project details, goals, and requirements..."
                />
              </div>

              {/* Project Manager */}
              <div>
                <label htmlFor="managerId" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Manager <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    required
                    disabled={!isAuthenticated || managersLoading}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!isAuthenticated ? 'Please log in first' : managersLoading ? 'Loading managers...' : managers.length === 0 ? 'No managers available' : 'Select a manager'}
                    </option>
                    {managers.map((manager) => (
                      <option key={manager.user_id} value={manager.user_id}>
                        {manager.name} ({manager.email}) - {manager.role === 'manager' ? 'Manager' : 'Developer'}
                      </option>
                    ))}
                  </select>
                </div>
                {!isAuthenticated && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs text-red-800 dark:text-red-200">
                          Please log in to select a project manager.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {isAuthenticated && managers.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <div className="flex">
                      <InformationCircleIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          No users available. Please add users first.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {managers.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {managers.filter(m => m.role === 'manager').length} managers, {managers.filter(m => m.role === 'developer').length} developers available
                  </p>
                )}
                {managersError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="ml-2">
                        <p className="text-xs text-red-800 dark:text-red-200">
                          Error loading managers: {managersError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Project Settings */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Project Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure priority and timeline</p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <label
                      key={priority}
                      className={`relative flex items-center p-3 border-2 rounded-md cursor-pointer transition-all duration-200 ${
                        formData.priority === priority
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`w-3 h-3 rounded-full border-2 mr-2 ${
                        formData.priority === priority
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-500'
                      }`} />
                      <div className="flex items-center">
                        <span className="text-sm mr-1">{getPriorityIcon(priority)}</span>
                        <span className={`text-xs font-medium capitalize ${
                          formData.priority === priority ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {priority}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Project Timeline
                </label>
                
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Project Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Project Preview
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.name || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Manager:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {managers.find(m => m.user_id == formData.managerId)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timeline:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.startDate && formData.endDate 
                        ? `${formData.startDate} to ${formData.endDate}`
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || managers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectForm;

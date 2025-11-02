import React, { useState, useEffect } from 'react';
import { useAuthStore, useProjectStore } from '../../store';
import { apiCall } from '../../store';
import { useToastContext } from '../../contexts/ToastContext';
import { 
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AddTaskForm = ({ projectId, onClose, onTaskAdded }) => {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const { showSuccess, showError } = useToastContext();
  
  // Fetch project's team members
  useEffect(() => {
    const fetchProjectTeam = async () => {
      try {
        setIsLoadingMembers(true);
        const result = await apiCall(`/projects/${projectId}`);
        if (result.success && result.data.success && result.data.data?.project) {
          const project = result.data.data.project;
          // Get team members from assignments
          const teamMembers = (project.assignments || []).map(assignment => ({
            user_id: assignment.user?.user_id || assignment.user?.id,
            id: assignment.user?.user_id || assignment.user?.id,
            name: assignment.user?.name,
            role: assignment.user?.role || assignment.role
          })).filter(member => member.role === 'developer');
          
          setTeamMembers(teamMembers);
          console.log('Team members fetched for task assignment:', teamMembers);
        } else {
          console.log('No team members found for project');
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Error fetching project team:', error);
        setTeamMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    if (projectId) {
      fetchProjectTeam();
    }
  }, [projectId]);
  
  const [formData, setFormData] = useState({
    task_name: '',
    task_details: '',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          task_name: formData.task_name,
          task_details: formData.task_details,
          status: formData.status,
          estimate_time: '01:00:00',
          projectId: projectId
        }),
        meta: { successMessage: 'Task created successfully' }
      });

      if (result.success && result.data.success) {
        onTaskAdded && onTaskAdded(result.data.data);
        showSuccess('Task created successfully');
        onClose();
      } else {
        const message = result.error || result.data?.message || 'Failed to create task';
        setError(message);
        showError(message);
      }
    } catch (err) {
      const message = 'Network error. Please try again.';
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              name="task_name"
              value={formData.task_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter task name"
            />
          </div>

          {/* Task Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Details
            </label>
            <textarea
              name="task_details"
              value={formData.task_details}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe the task..."
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned To
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              disabled={isLoadingMembers}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingMembers ? 'Loading team members...' : 
                 teamMembers.length === 0 ? 'No team members available' : 
                 'Select team member'}
              </option>
              {teamMembers.map((member) => (
                <option key={member.user_id || member.id} value={member.user_id || member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {teamMembers.length === 0 && !isLoadingMembers && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Add team members to the project first to assign tasks
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskForm;

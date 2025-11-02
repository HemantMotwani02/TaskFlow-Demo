import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore, useProjectStore } from '../../../store';
import { ArrowLeftIcon, FunnelIcon } from '@heroicons/react/24/outline';
import ShowLogsByPidTid from "./ShowLogsByPidTid";

const ViewSingleTaskLogs = () => {
  const navigate = useNavigate();
  const { project_id, task_id } = useParams();
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  const [selectedValue, setSelectedValue] = useState('');
  const [flag, setFlag] = useState(0);
  const [taskName, setTaskName] = useState('');

  // Find task name from projects or fetch from API
  useEffect(() => {
    const fetchTaskName = async () => {
      if (task_id) {
        // First try to find in projects store
        if (projects.length > 0) {
          for (const project of projects) {
            const task = project.tasks?.find(t => (t.task_id || t.id) == task_id);
            if (task) {
              setTaskName(task.task_name || task.title || 'Unknown Task');
              return;
            }
          }
        }
        
        // If not found in store, fetch from API
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/tasks/${task_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setTaskName(data.data.task_name || data.data.title || 'Unknown Task');
            }
          }
        } catch (error) {
          console.error('Error fetching task name:', error);
          setTaskName(`Task ID: ${task_id}`);
        }
      }
    };

    fetchTaskName();
  }, [projects, task_id]);

  const parentFunction = () => {
    setFlag(prev => prev === 0 ? 1 : 0);
  };

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Back Button */}
      <div className="mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Logs</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {taskName ? (
              <>View logs for: <span className="font-medium">{taskName}</span></>
            ) : (
              <>Loading task information...</>
            )}
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</span>
            </div>
            <select
              value={selectedValue}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All logs</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            {selectedValue && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium capitalize">{selectedValue}</span> logs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Logs Content */}
      {project_id && task_id ? (
        <ShowLogsByPidTid 
          flag={flag} 
          parentFunction={parentFunction} 
          selectedValue={selectedValue} 
          project_id={project_id} 
          task_id={task_id}
          taskName={taskName}
        />
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading logs...</p>
          </div>
        </div>
      )}
    </div>
  );
}


export default ViewSingleTaskLogs;
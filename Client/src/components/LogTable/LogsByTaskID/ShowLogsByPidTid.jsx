import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuthStore } from '../../../store';
import { 
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ShowLogsByPidTid = ({ project_id, task_id, selectedValue, parentFunction, flag, taskName }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const url = `/api/logs/task/${task_id}${selectedValue ? `?status=${selectedValue}` : ''}`;
        
        console.log('=== FRONTEND LOGS DEBUG ===');
        console.log('Fetching logs from URL:', url);
        console.log('Task ID:', task_id);
        console.log('Selected Value:', selectedValue);
        console.log('Token exists:', !!token);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          console.log('Logs fetched successfully:', data.data.logs);
          console.log('Number of logs:', data.data.logs.length);
          // Debug: Log the first log to see its structure
          if (data.data.logs.length > 0) {
            console.log('First log data:', data.data.logs[0]);
            console.log('First log log_date:', data.data.logs[0].log_date);
            console.log('First log formattedTime:', data.data.logs[0].formattedTime);
          } else {
            console.log('No logs found in response');
          }
          setLogs(data.data.logs);
        } else {
          console.error('API returned error:', data.message);
          setError(data.message || 'Failed to fetch logs');
        }
        console.log('=== END FRONTEND LOGS DEBUG ===');
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to fetch logs');
      } finally {
        setIsLoading(false);
      }
    };

    if (task_id) {
      console.log('Starting to fetch logs for task_id:', task_id);
      fetchLogs();
    } else {
      console.log('No task_id provided, skipping fetch');
    }
  }, [task_id, selectedValue, flag]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
    }
  };


  const formatLogDate = (logDate) => {
    if (!logDate) {
      return 'No date';
    }
    
    // log_date is already in dd/mm/yyyy format from backend
    return logDate;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading logs</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {taskName ? `${taskName} - Logs` : 'Task Logs'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {logs.length} log{logs.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Log Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Log Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logged By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log, index) => (
                <tr key={log.log_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.logdata}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {log.start_time} - {log.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-blue-500 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.formattedTime || '0h 0m'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatLogDate(log.log_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900 dark:text-white">
                        {log.user?.name || 'Unknown'}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No logs found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedValue ? `No ${selectedValue} logs found for this task.` : 'No logs have been created for this task yet.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ShowLogsByPidTid;
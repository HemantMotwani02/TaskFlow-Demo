import React, { useState } from 'react';
import { useTaskStore } from '../../store';
import { 
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const QuickStatusUpdate = ({ task, onStatusUpdated }) => {
  const { updateTask } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'todo', label: 'Todo', icon: ClockIcon, color: 'text-gray-600 dark:text-gray-400' },
    { value: 'in_progress', label: 'In Progress', icon: ClockIcon, color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'text-green-600 dark:text-green-400' }
  ];

  const currentStatus = statusOptions.find(option => option.value === task.status) || statusOptions[0];
  const CurrentIcon = currentStatus.icon;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateTask(task.id || task.task_id, { status: newStatus });
      
      if (result.success) {
        onStatusUpdated && onStatusUpdated(result.task || task);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
      >
        <CurrentIcon className={`h-4 w-4 mr-2 ${currentStatus.color}`} />
        {currentStatus.label}
        <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="py-1">
            {statusOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating}
                  className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    task.status === option.value 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <OptionIcon className={`h-4 w-4 mr-3 ${option.color}`} />
                  {option.label}
                  {task.status === option.value && (
                    <CheckCircleIcon className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickStatusUpdate;
